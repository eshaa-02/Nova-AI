"use client";

import { Sparkles, Paperclip, Mic, ArrowUp } from "lucide-react";

/**
 * A genuine miniature chat UI (not a static image) used in the hero.
 * Built from the same visual language as the real chat workspace so it
 * feels integrated rather than pasted in.
 */
export function WorkspacePreview() {
  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-surface shadow-nova-lg">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        <span className="ml-3 text-xs text-muted">Nova AI — Chat</span>
      </div>

      <div className="space-y-4 p-6">
        <div className="ml-auto max-w-[75%] rounded-xl rounded-tr-sm bg-accent-soft px-4 py-2.5 text-sm text-text">
          Summarize the key risks in this term sheet, then draft three follow-up questions.
        </div>

        <div className="flex gap-3">
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent text-background">
            <Sparkles size={13} />
          </div>
          <div className="max-w-[80%] rounded-xl rounded-tl-sm bg-surface-elevated px-4 py-3 text-sm leading-relaxed text-text-secondary">
            <span className="text-text">Three risks stand out:</span> uncapped liquidation preference,
            a broad anti-dilution clause, and founder vesting reset on the new round.
            <span className="ml-1 inline-flex gap-1 align-middle">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-muted [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-muted" />
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-muted [animation-delay:0.2s]" />
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5">
          <Paperclip size={16} className="flex-none text-muted" />
          <span className="flex-1 text-sm text-muted">Message Nova AI...</span>
          <Mic size={16} className="flex-none text-muted" />
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-accent text-background">
            <ArrowUp size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
