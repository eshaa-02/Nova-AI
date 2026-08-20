"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, Trash2, Loader2, AlertTriangle } from "lucide-react";
import type { FileAsset } from "@nova-ai/shared";
import { formatBytes } from "@/lib/utils/formatBytes";
import { useFilesStore } from "@/stores/files.store";

const ACTIONS = [
  { key: "summarize" as const, label: "Summarize" },
  { key: "extract" as const, label: "Extract" },
  { key: "explain" as const, label: "Explain" },
];

export function FileCard({ file }: { file: FileAsset }) {
  const { deleteFile, runAction } = useFilesStore();
  const [pending, setPending] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const isImage = file.mimeType.startsWith("image/");

  async function handleAction(action: "summarize" | "extract" | "explain" | "ask") {
    setPending(action);
    setResult(null);
    try {
      const text = await runAction(file.id, action, action === "ask" ? question : undefined);
      setResult(text);
    } catch {
      // Error toast already shown by the store.
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-md bg-accent-soft text-accent">
            {isImage ? <ImageIcon size={16} /> : <FileText size={16} />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm text-text">{file.fileName}</p>
            <p className="text-xs text-muted">
              {formatBytes(file.sizeBytes)} · {file.status === "ready" ? "Ready" : file.status === "failed" ? "Failed" : "Processing"}
            </p>
          </div>
        </div>
        <button
          onClick={() => deleteFile(file.id)}
          aria-label="Delete file"
          className="flex-none rounded-md p-1.5 text-muted hover:bg-error/10 hover:text-error"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {file.status === "failed" && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-error">
          <AlertTriangle size={12} /> {file.errorMessage || "Could not process this file."}
        </p>
      )}

      {file.status === "ready" && !isImage && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                onClick={() => handleAction(a.key)}
                disabled={pending !== null}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-text disabled:opacity-50"
              >
                {pending === a.key && <Loader2 size={11} className="animate-spin" />}
                {a.label}
              </button>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this file..."
              className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              onClick={() => handleAction("ask")}
              disabled={!question.trim() || pending !== null}
              className="rounded-md border border-border px-3 text-xs text-text-secondary hover:text-text disabled:opacity-50"
            >
              {pending === "ask" ? <Loader2 size={13} className="animate-spin" /> : "Ask"}
            </button>
          </div>

          {result && (
            <div className="mt-3 rounded-md border border-border bg-background p-3 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
              {result}
            </div>
          )}
        </>
      )}
    </div>
  );
}
