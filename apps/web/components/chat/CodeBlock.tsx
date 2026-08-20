"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const language = /language-(\w+)/.exec(className || "")?.[1] || "text";
  const codeText = String(children).replace(/\n$/, "");

  async function handleCopy() {
    await navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between rounded-t-md border border-b-0 border-border bg-surface px-3.5 py-1.5">
        <span className="text-xs text-muted">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-text"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="!mt-0 !rounded-t-none">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
