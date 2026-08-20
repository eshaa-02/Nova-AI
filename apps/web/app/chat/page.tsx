"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { ChatTopBar } from "@/components/chat/ChatTopBar";
import { Composer } from "@/components/chat/Composer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useChatStore } from "@/stores/chat.store";

export default function ChatIndexPage() {
  const router = useRouter();
  const createConversation = useChatStore((s) => s.createConversation);
  const sendMessage = useChatStore((s) => s.sendMessage);

  async function handleFirstMessage(content: string) {
    const conversation = await createConversation();
    router.push(`/chat/${conversation.id}`);
    // Small delay lets the new route mount its socket listeners before we emit.
    setTimeout(() => sendMessage(conversation.id, content), 150);
  }

  return (
    <ChatShell>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatTopBar />
        <EmptyState
          icon={Sparkles}
          title="What can I help with?"
          description="Ask a question, brainstorm an idea, or start a new conversation below."
          action={
            <Button variant="secondary" size="sm" onClick={() => createConversation().then((c) => router.push(`/chat/${c.id}`))}>
              New chat
            </Button>
          }
        />
        <Composer onSend={handleFirstMessage} onStop={() => {}} generating={false} />
      </div>
    </ChatShell>
  );
}
