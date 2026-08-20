"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Copy, Check, RotateCcw, Star, Pencil, Trash2, AlertTriangle } from "lucide-react";
import type { ChatMessage } from "@nova-ai/shared";
import { cn } from "@/lib/utils/cn";
import { CodeBlock } from "./CodeBlock";

export function MessageBubble({
  message,
  onRegenerate,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  message: ChatMessage;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isUser) {
    return (
      <div className="group flex justify-end px-4 py-2 sm:px-0">
        <div className="flex max-w-[85%] flex-col items-end gap-1 sm:max-w-[70%]">
          <div className="rounded-xl rounded-tr-sm bg-accent-soft px-4 py-2.5 text-[15px] leading-relaxed text-text whitespace-pre-wrap break-words">
            {message.content}
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <ActionButton icon={copied ? Check : Copy} label="Copy" onClick={handleCopy} />
            {onEdit && <ActionButton icon={Pencil} label="Edit" onClick={onEdit} />}
            {onDelete && <ActionButton icon={Trash2} label="Delete" onClick={onDelete} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex gap-3 px-4 py-3 sm:px-0">
      <div className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent text-background">
        <Sparkles size={13} />
      </div>
      <div className="min-w-0 max-w-[85%] flex-1 sm:max-w-[75%]">
        {message.status === "failed" ? (
          <div className="flex items-start gap-2 rounded-md border border-error/30 bg-error/5 px-3.5 py-2.5 text-sm text-error">
            <AlertTriangle size={15} className="mt-0.5 flex-none" />
            <span>{message.errorMessage || "Generation failed."}</span>
          </div>
        ) : (
          <div className="prose-nova text-[15px]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }: any) {
                  const isBlock = /language-/.test(className || "");
                  if (!isBlock) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return <CodeBlock className={className}>{children}</CodeBlock>;
                },
              }}
            >
              {message.content || " "}
            </ReactMarkdown>
            {message.status === "streaming" && (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse-soft bg-accent align-middle" />
            )}
          </div>
        )}

        {message.status !== "streaming" && message.content && (
          <div className="mt-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <ActionButton icon={copied ? Check : Copy} label="Copy" onClick={handleCopy} />
            {onRegenerate && <ActionButton icon={RotateCcw} label="Regenerate" onClick={onRegenerate} />}
            {onToggleFavorite && (
              <ActionButton
                icon={Star}
                label="Favorite"
                active={message.isFavorite}
                onClick={onToggleFavorite}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        active ? "text-accent" : "text-muted hover:bg-surface hover:text-text-secondary"
      )}
    >
      <Icon size={13} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
