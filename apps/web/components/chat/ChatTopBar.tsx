"use client";

import { Share2, MoreHorizontal } from "lucide-react";
import { ModelSelector } from "./ModelSelector";
import type { Conversation } from "@nova-ai/shared";

export function ChatTopBar({ conversation }: { conversation?: Conversation }) {
  return (
    <header className="flex h-14 flex-none items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <ModelSelector value={conversation?.model} />
        <span className="hidden truncate text-sm text-text-secondary sm:inline">
          {conversation?.title}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          aria-label="Share conversation"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-text"
        >
          <Share2 size={16} />
        </button>
        <button
          aria-label="More options"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-text"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
    </header>
  );
}
