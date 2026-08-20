"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Paperclip, Mic, ArrowUp, Square, Search, ImageIcon, Wrench } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Composer({
  onSend,
  onStop,
  generating,
}: {
  onSend: (content: string) => void;
  onStop: () => void;
  generating: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [toolsOpen, setToolsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || generating) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-border bg-background px-4 pb-4 pt-3 sm:px-0">
      <div className="mx-auto max-w-3xl">
        {generating && (
          <div className="mb-2 flex items-center gap-2 text-xs text-text-secondary">
            <span className="flex gap-1">
              <span className="h-1 w-1 animate-pulse-soft rounded-full bg-accent [animation-delay:-0.2s]" />
              <span className="h-1 w-1 animate-pulse-soft rounded-full bg-accent" />
              <span className="h-1 w-1 animate-pulse-soft rounded-full bg-accent [animation-delay:0.2s]" />
            </span>
            Nova is thinking...
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface shadow-nova-sm focus-within:border-accent/50">
          <div className="flex items-end gap-2 px-3 pt-3">
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              aria-label="More options"
              className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-muted hover:bg-surface-elevated hover:text-text"
            >
              <Plus size={18} />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                autoGrow();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message Nova AI..."
              aria-label="Message Nova AI"
              className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-[15px] text-text placeholder:text-muted focus:outline-none"
            />

            <button
              type="button"
              aria-label="Voice input"
              className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-muted hover:bg-surface-elevated hover:text-text"
            >
              <Mic size={17} />
            </button>

            {generating ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-text text-background hover:opacity-90"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!value.trim()}
                aria-label="Send message"
                className={cn(
                  "flex h-8 w-8 flex-none items-center justify-center rounded-md transition-colors",
                  value.trim() ? "bg-accent text-background hover:bg-accent-hover" : "bg-border text-muted"
                )}
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>

          {toolsOpen && (
            <div className="flex flex-wrap gap-2 border-t border-border px-3 py-2.5 animate-fade-in">
              <ToolChip icon={Search} label="Search Web" onClick={() => router.push("/search")} />
              <ToolChip icon={ImageIcon} label="Create Image" onClick={() => router.push("/image")} />
              <ToolChip icon={Paperclip} label="Attach File" onClick={() => router.push("/files")} />
              <ToolChip icon={Wrench} label="Tools" onClick={() => router.push("/tools")} />
            </div>
          )}
        </div>

        <p className="mt-2 text-center text-[11px] text-muted">
          Nova AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}

function ToolChip({ icon: Icon, label, onClick }: { icon: typeof Search; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-text"
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
