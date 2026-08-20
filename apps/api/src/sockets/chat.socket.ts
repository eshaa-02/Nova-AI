import type { Server, Socket } from "socket.io";
import {
  SOCKET_EVENTS,
  type MessageSendEvent,
  type MessageStopEvent,
  type MessageErrorEvent,
} from "@nova-ai/shared";
import { Conversation } from "../models/Conversation";
import { Message, type IMessage } from "../models/Message";
import { getAIProvider } from "../services/ai/AIProviderFactory";
import type { ChatHistoryTurn } from "../services/ai/AIProvider.interface";

export function toMessageDTO(message: IMessage) {
  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    role: message.role,
    content: message.content,
    status: message.status,
    model: message.model,
    attachments: message.attachments,
    isFavorite: message.isFavorite,
    errorMessage: message.errorMessage,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
  };
}

const MAX_HISTORY_TURNS = 20;

// Active AI generations
const activeGenerations = new Map<string, AbortController>();

// Conversations manually stopped by the user
const stoppedConversations = new Set<string>();

function emitError(socket: Socket, payload: MessageErrorEvent) {
  socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, payload);
}

function generateTitle(content: string): string {
  const text = content
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[?.!,]+$/g, "");

  if (!text) return "New chat";

  const lower = text.toLowerCase();

  // Difference / comparison
  const differenceMatch = lower.match(
    /(?:what is the |what is |)?difference between (.+?) and (.+)/i
  );

  if (differenceMatch) {
    return `${capitalizeWords(differenceMatch[1])} vs ${capitalizeWords(
      differenceMatch[2]
    )}`.slice(0, 40);
  }

  // What is X?
  const whatIsMatch = text.match(
    /^(?:what is|what are|explain|tell me about)\s+(?:the\s+)?(.+)/i
  );

  if (whatIsMatch) {
    const topic = whatIsMatch[1]
      .replace(/\b(?:in simple words|basically|briefly|please)\b/gi, "")
      .trim();

    return `${capitalizeWords(topic)} Basics`.slice(0, 40);
  }

  // How to X?
  const howToMatch = text.match(
    /^(?:how to|how do i|how can i)\s+(.+)/i
  );

  if (howToMatch) {
    return `How To ${capitalizeWords(howToMatch[1])}`.slice(0, 40);
  }

  // General greeting/chat
  if (/^(hello|hi|hey)\b/i.test(text)) {
    return "New Conversation";
  }

  // Remove unnecessary common words
  const cleaned = text
    .replace(
      /^(can you|could you|please|i want to know|i want|help me|tell me)\s+/i,
      ""
    )
    .trim();

  return capitalizeWords(
    cleaned.split(" ").slice(0, 4).join(" ")
  ).slice(0, 40);
}

function capitalizeWords(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();

      // Keep technical abbreviations uppercase
      if (["mern", "ai", "api", "css", "html", "js", "ts"].includes(lower)) {
        return lower.toUpperCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function registerChatHandlers(_io: Server, socket: Socket) {
  const userId = socket.data.userId as string;

  socket.on(
    SOCKET_EVENTS.MESSAGE_SEND,
    async (payload: MessageSendEvent) => {
      const { conversationId, content, clientMessageId } = payload;

      if (!content?.trim()) {
        return emitError(socket, {
          conversationId,
          clientMessageId,
          code: "VALIDATION_ERROR",
          message: "Message cannot be empty.",
        });
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
      });

      if (!conversation) {
        return emitError(socket, {
          conversationId,
          clientMessageId,
          code: "CONVERSATION_NOT_FOUND",
          message: "Conversation not found.",
        });
      }

      // Remove any previous stop state before starting a new response
      stoppedConversations.delete(conversationId);

      // Save user message
      const userMessage = await Message.create({
        conversationId: conversation._id,
        userId,
        role: "user",
        content: content.trim(),
        status: "complete",
      });

      conversation.messageCount += 1;
      conversation.lastMessagePreview = content.trim().slice(0, 280);

      // Generate a proper heading from the first user message
      if (conversation.messageCount === 1) {
        conversation.title = generateTitle(content);
      }

      await conversation.save();

      socket.emit(SOCKET_EVENTS.MESSAGE_ACK, {
        clientMessageId,
        userMessage: toMessageDTO(userMessage),
      });

      // Get conversation history
      const priorMessages = await Message.find({
        conversationId: conversation._id,
      })
        .sort({ createdAt: -1 })
        .limit(MAX_HISTORY_TURNS);

      const history: ChatHistoryTurn[] = priorMessages
        .reverse()
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const provider = getAIProvider();

      // Create assistant message
      const assistantMessage = await Message.create({
        conversationId: conversation._id,
        userId,
        role: "assistant",
        content: "",
        status: "streaming",
        model: provider.model,
      });

      const abortController = new AbortController();

      // Use the exact same ID received from frontend
      activeGenerations.set(conversationId, abortController);

      socket.emit(SOCKET_EVENTS.MESSAGE_STREAM_START, {
        conversationId,
        messageId: assistantMessage.id,
        model: provider.model,
      });

      let fullText = "";

      try {
        for await (const chunk of provider.streamChat({
          history,
          systemPrompt: conversation.systemPrompt,
          signal: abortController.signal,
        })) {
          // Stop immediately sending chunks when user clicks Stop
          if (
            abortController.signal.aborted ||
            stoppedConversations.has(conversationId)
          ) {
            break;
          }

          fullText += chunk.delta;

          socket.emit(SOCKET_EVENTS.MESSAGE_STREAM_CHUNK, {
            conversationId,
            messageId: assistantMessage.id,
            delta: chunk.delta,
          });
        }

        // Handle stopped generation
        if (
          abortController.signal.aborted ||
          stoppedConversations.has(conversationId)
        ) {
          assistantMessage.status = "stopped";
          assistantMessage.content = fullText;
          await assistantMessage.save();

          socket.emit(SOCKET_EVENTS.MESSAGE_STREAM_STOPPED, {
            conversationId,
            messageId: assistantMessage.id,
          });

          return;
        }

        // Empty response
        if (!fullText.trim()) {
          assistantMessage.status = "failed";
          assistantMessage.errorMessage =
            "The AI provider returned an empty response.";

          await assistantMessage.save();

          emitError(socket, {
            conversationId,
            messageId: assistantMessage.id,
            code: "INTERNAL_ERROR",
            message:
              "The AI provider returned an empty response. Please try again.",
          });

          return;
        }

        // Successful response
        assistantMessage.status = "complete";
        assistantMessage.content = fullText;
        await assistantMessage.save();

        conversation.messageCount += 1;
        conversation.lastMessagePreview = fullText.slice(0, 280);
        await conversation.save();

        socket.emit(SOCKET_EVENTS.MESSAGE_STREAM_END, {
          conversationId,
          message: toMessageDTO(assistantMessage),
        });
      } catch (err: any) {
        // AbortError / Stop button
        if (
          abortController.signal.aborted ||
          stoppedConversations.has(conversationId)
        ) {
          assistantMessage.status = "stopped";
          assistantMessage.content = fullText;
          await assistantMessage.save();

          socket.emit(SOCKET_EVENTS.MESSAGE_STREAM_STOPPED, {
            conversationId,
            messageId: assistantMessage.id,
          });

          return;
        }

        // Actual provider error
        assistantMessage.status = "failed";
        assistantMessage.content = fullText;
        assistantMessage.errorMessage =
          err?.message || "Generation failed.";

        await assistantMessage.save();

        emitError(socket, {
          conversationId,
          messageId: assistantMessage.id,
          code:
            err?.code === "RATE_LIMITED"
              ? "RATE_LIMITED"
              : "PROVIDER_UNAVAILABLE",
          message:
            err?.message ||
            "The AI provider is temporarily unavailable. Please try again.",
        });
      } finally {
        activeGenerations.delete(conversationId);
        stoppedConversations.delete(conversationId);
      }
    }
  );

  // STOP BUTTON HANDLER
  socket.on(
    SOCKET_EVENTS.MESSAGE_STOP,
    async (payload: MessageStopEvent) => {
      const { conversationId } = payload;

      // Mark generation as stopped
      stoppedConversations.add(conversationId);

      // Abort AI request
      const controller = activeGenerations.get(conversationId);

      if (controller) {
        controller.abort();
      }

      // IMPORTANT: immediately update the streaming message in MongoDB
      const assistantMessage = await Message.findOne({
        conversationId,
        userId,
        role: "assistant",
        status: "streaming",
      }).sort({ createdAt: -1 });

      if (assistantMessage) {
        assistantMessage.status = "stopped";
        await assistantMessage.save();

        // Immediately tell frontend to stop thinking
        socket.emit(SOCKET_EVENTS.MESSAGE_STREAM_STOPPED, {
          conversationId,
          messageId: assistantMessage._id.toString(),
        });
      }
    }
  );
}