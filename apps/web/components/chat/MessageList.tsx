"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { ChatMessage } from "@nova-ai/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageBubble } from "./MessageBubble";
import { NovaApiClient } from "@/lib/api/client";
import { useChatStore } from "@/stores/chat.store";

export function MessageList({ conversationId, messages }: { conversationId: string; messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const loadMessages = useChatStore((s) => s.loadMessages);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, messages[messages.length - 1]?.content]);

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Start the conversation"
        description="Ask a question, brainstorm an idea, or paste something you'd like Nova to help with."
      />
    );
  }

  async function handleRegenerate(message: ChatMessage) {
    // Find the preceding user message and resend it; the backend appends
    // a fresh assistant turn using the existing conversation history.
    const idx = messages.findIndex((m) => m.id === message.id);
    const priorUser = [...messages.slice(0, idx)].reverse().find((m) => m.role === "user");
    if (priorUser) sendMessage(conversationId, priorUser.content);
  }

  async function handleToggleFavorite(message: ChatMessage) {
    await NovaApiClient.post(`/api/messages/${message.id}/favorite`);
    await loadMessages(conversationId);
  }

  async function handleDelete(message: ChatMessage) {
    await NovaApiClient.delete(`/api/messages/${message.id}`);
    await loadMessages(conversationId);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col py-6">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onRegenerate={message.role === "assistant" ? () => handleRegenerate(message) : undefined}
          onToggleFavorite={message.role === "assistant" ? () => handleToggleFavorite(message) : undefined}
          onDelete={message.role === "user" ? () => handleDelete(message) : undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
