"use client";

import { create } from "zustand";
import type { ChatMessage, Conversation } from "@nova-ai/shared";
import {
  SOCKET_EVENTS,
  type MessageAckEvent,
  type MessageStreamChunkEvent,
  type MessageStreamEndEvent,
  type MessageErrorEvent,
} from "@nova-ai/shared";
import { NovaApiClient } from "@/lib/api/client";
import { getSocket } from "@/lib/socket/client";
import { useToastStore } from "@/stores/toast.store";

interface ChatState {
  conversations: Conversation[];
  messagesByConversation: Record<string, ChatMessage[]>;
  streamingMessageId: string | null;
  generating: boolean;
  lastError: string | null;

  loadConversations: () => Promise<void>;
  createConversation: () => Promise<Conversation>;
  renameConversation: (id: string, title: string) => Promise<void>;
  togglePin: (id: string, isPinned: boolean) => Promise<void>;
  toggleArchive: (id: string, isArchived: boolean) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;

  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => void;
  stopGeneration: (conversationId: string) => void;

  bindSocketListeners: () => () => void;
}

function getSimpleTitle(text: string): string {
  const cleaned = text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[?!.,]+$/g, "")
    .replace(
      /^(what is|what are|how to|how do i|can you|could you|please|tell me about|help me)\s+/i,
      ""
    )
    .trim();

  const differenceMatch = cleaned.match(
    /difference between\s+(.+?)\s+and\s+(.+)/i
  );

  if (differenceMatch) {
    return `${differenceMatch[1]} vs ${differenceMatch[2]}`
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .slice(0, 50);
  }

  const title = cleaned
    .split(" ")
    .slice(0, 5)
    .join(" ");

  return (
    title.replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 50) ||
    "New chat"
  );
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messagesByConversation: {},
  streamingMessageId: null,
  generating: false,
  lastError: null,

  loadConversations: async () => {
    const data = await NovaApiClient.get<{
      conversations: Conversation[];
    }>("/api/conversations");

    set({
      conversations: data.conversations,
    });
  },

  createConversation: async () => {
    const data = await NovaApiClient.post<{
      conversation: Conversation;
    }>("/api/conversations", {});

    set((state) => ({
      conversations: [data.conversation, ...state.conversations],
    }));

    return data.conversation;
  },

  renameConversation: async (id, title) => {
    const data = await NovaApiClient.patch<{
      conversation: Conversation;
    }>(`/api/conversations/${id}`, { title });

    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === id ? data.conversation : conversation
      ),
    }));

    useToastStore.getState().show("Conversation renamed", "success");
  },

  togglePin: async (id, isPinned) => {
    const data = await NovaApiClient.patch<{
      conversation: Conversation;
    }>(`/api/conversations/${id}`, { isPinned });

    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === id ? data.conversation : conversation
      ),
    }));
  },

  toggleArchive: async (id, isArchived) => {
    const data = await NovaApiClient.patch<{
      conversation: Conversation;
    }>(`/api/conversations/${id}`, { isArchived });

    set((state) => ({
      conversations: isArchived
        ? state.conversations.filter(
          (conversation) => conversation.id !== id
        )
        : state.conversations.map((conversation) =>
          conversation.id === id ? data.conversation : conversation
        ),
    }));
  },

  deleteConversation: async (id) => {
    await NovaApiClient.delete(`/api/conversations/${id}`);

    set((state) => ({
      conversations: state.conversations.filter(
        (conversation) => conversation.id !== id
      ),
      messagesByConversation: Object.fromEntries(
        Object.entries(state.messagesByConversation).filter(
          ([conversationId]) => conversationId !== id
        )
      ),
    }));

    useToastStore.getState().show("Conversation deleted", "success");
  },

  loadMessages: async (conversationId) => {
    const data = await NovaApiClient.get<{
      messages: ChatMessage[];
    }>(`/api/conversations/${conversationId}/messages`);

    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: data.messages,
      },
    }));
  },

  sendMessage: (conversationId, content) => {
    const trimmedContent = content.trim();

    if (!trimmedContent) return;

    const socket = getSocket();
    const clientMessageId = crypto.randomUUID();
    const now = new Date().toISOString();

    const optimisticMessage: ChatMessage = {
      id: clientMessageId,
      conversationId,
      role: "user",
      content: trimmedContent,
      status: "complete",
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [
          ...(state.messagesByConversation[conversationId] || []),
          optimisticMessage,
        ],
      },
      generating: true,
      streamingMessageId: null,
      lastError: null,

      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId &&
          conversation.title === "New chat"
          ? {
            ...conversation,
            title: getSimpleTitle(trimmedContent),
            lastMessagePreview: trimmedContent.slice(0, 280),
            updatedAt: now,
          }
          : conversation
      ),
    }));

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
      conversationId,
      content: trimmedContent,
      clientMessageId,
    });
  },

  stopGeneration: (conversationId) => {
    const socket = getSocket();

    set({
      generating: false,
      streamingMessageId: null,
    });

    socket.emit(SOCKET_EVENTS.MESSAGE_STOP, {
      conversationId,
    });
  },

  bindSocketListeners: () => {
    const socket = getSocket();

    const onAck = (payload: MessageAckEvent) => {
      set((state) => {
        const conversationId = payload.userMessage.conversationId;
        const messages =
          state.messagesByConversation[conversationId] || [];

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: messages.map((message) =>
              message.id === payload.clientMessageId
                ? payload.userMessage
                : message
            ),
          },

          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                ...conversation,
                lastMessagePreview:
                  payload.userMessage.content.slice(0, 280),
                updatedAt: payload.userMessage.updatedAt,
              }
              : conversation
          ),
        };
      });
    };

    // THIS WAS MISSING IN YOUR FILE
    const onStreamStart = (payload: {
      conversationId: string;
      messageId: string;
      model: string;
    }) => {
      const now = new Date().toISOString();

      const placeholder: ChatMessage = {
        id: payload.messageId,
        conversationId: payload.conversationId,
        role: "assistant",
        content: "",
        status: "streaming",
        model: payload.model,
        createdAt: now,
        updatedAt: now,
      };

      set((state) => {
        const messages =
          state.messagesByConversation[payload.conversationId] || [];

        // Prevent duplicate placeholder
        if (messages.some((message) => message.id === payload.messageId)) {
          return {
            generating: true,
            streamingMessageId: payload.messageId,
          };
        }

        return {
          generating: true,
          streamingMessageId: payload.messageId,
          messagesByConversation: {
            ...state.messagesByConversation,
            [payload.conversationId]: [...messages, placeholder],
          },
        };
      });
    };

    const onChunk = (payload: MessageStreamChunkEvent) => {
      set((state) => {
        const messages =
          state.messagesByConversation[payload.conversationId] || [];

        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [payload.conversationId]: messages.map((message) =>
              message.id === payload.messageId
                ? {
                  ...message,
                  content: message.content + payload.delta,
                  status: "streaming" as const,
                  updatedAt: new Date().toISOString(),
                }
                : message
            ),
          },
        };
      });
    };

    const onEnd = (payload: MessageStreamEndEvent) => {
      set((state) => {
        const conversationId = payload.message.conversationId;
        const messages =
          state.messagesByConversation[conversationId] || [];

        return {
          generating: false,
          streamingMessageId: null,
          lastError: null,

          conversations: state.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                ...conversation,
                lastMessagePreview:
                  payload.message.content.slice(0, 280),
                messageCount: conversation.messageCount + 1,
                updatedAt: payload.message.updatedAt,
              }
              : conversation
          ),

          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: messages.map((message) =>
              message.id === payload.message.id
                ? payload.message
                : message
            ),
          },
        };
      });
    };

    const onStopped = (payload: {
      conversationId: string;
      messageId: string;
    }) => {
      set((state) => {
        const messages =
          state.messagesByConversation[payload.conversationId] || [];

        return {
          generating: false,
          streamingMessageId: null,

          messagesByConversation: {
            ...state.messagesByConversation,
            [payload.conversationId]: messages.map((message) =>
              message.id === payload.messageId
                ? {
                  ...message,
                  status: "stopped" as const,
                  updatedAt: new Date().toISOString(),
                }
                : message
            ),
          },
        };
      });
    };

    const onError = (payload: MessageErrorEvent) => {
      set((state) => {
        const conversationId = payload.conversationId;

        const messages =
          state.messagesByConversation[conversationId] || [];

        return {
          generating: false,
          streamingMessageId: null,
          lastError: payload.message,

          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: messages.map((message) =>
              message.id === payload.messageId
                ? {
                  ...message,
                  status: "failed" as const,
                  errorMessage: payload.message,
                  updatedAt: new Date().toISOString(),
                }
                : message
            ),
          },
        };
      });

      useToastStore.getState().show(payload.message, "error");
    };

    socket.on(SOCKET_EVENTS.MESSAGE_ACK, onAck);
    socket.on(SOCKET_EVENTS.MESSAGE_STREAM_START, onStreamStart);
    socket.on(SOCKET_EVENTS.MESSAGE_STREAM_CHUNK, onChunk);
    socket.on(SOCKET_EVENTS.MESSAGE_STREAM_END, onEnd);
    socket.on(SOCKET_EVENTS.MESSAGE_STREAM_STOPPED, onStopped);
    socket.on(SOCKET_EVENTS.MESSAGE_ERROR, onError);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_ACK, onAck);
      socket.off(SOCKET_EVENTS.MESSAGE_STREAM_START, onStreamStart);
      socket.off(SOCKET_EVENTS.MESSAGE_STREAM_CHUNK, onChunk);
      socket.off(SOCKET_EVENTS.MESSAGE_STREAM_END, onEnd);
      socket.off(SOCKET_EVENTS.MESSAGE_STREAM_STOPPED, onStopped);
      socket.off(SOCKET_EVENTS.MESSAGE_ERROR, onError);
    };
  },
}));