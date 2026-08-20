"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { ChatTopBar } from "@/components/chat/ChatTopBar";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";
import { useChatStore } from "@/stores/chat.store";

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params.id;

  const {
    conversations,
    messagesByConversation,
    loadMessages,
    sendMessage,
    stopGeneration,
    generating,
    lastError,
  } = useChatStore();

  useEffect(() => {
    if (conversationId) loadMessages(conversationId);
  }, [conversationId, loadMessages]);

  const conversation = conversations.find((c) => c.id === conversationId);
  const messages = messagesByConversation[conversationId] || [];

  return (
    <ChatShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatTopBar conversation={conversation} />

        {lastError && (
          <div className="flex items-center gap-2 border-b border-error/20 bg-error/5 px-4 py-2 text-sm text-error">
            <AlertCircle size={14} className="flex-none" />
            {lastError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <MessageList conversationId={conversationId} messages={messages} />
        </div>

        <Composer
          onSend={(content) => sendMessage(conversationId, content)}
          onStop={() => stopGeneration(conversationId)}
          generating={generating}
        />
      </div>
    </ChatShell>
  );
}
