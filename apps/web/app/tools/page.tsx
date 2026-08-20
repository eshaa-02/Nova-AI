"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Languages,
  Mail,
  SpellCheck,
  Code2,
  UserSquare2,
  GraduationCap,
  NotebookPen,
  PenLine,
  Braces,
  Database,
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  Wrench,
} from "lucide-react";
import type { ToolDefinition } from "@nova-ai/shared";
import { ChatShell } from "@/components/chat/ChatShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { NovaApiClient, NovaApiError } from "@/lib/api/client";

const ICONS: Record<string, typeof FileText> = {
  summarizer: FileText,
  translator: Languages,
  "email-writer": Mail,
  "grammar-assistant": SpellCheck,
  "code-explainer": Code2,
  "resume-helper": UserSquare2,
  "study-assistant": GraduationCap,
  "meeting-notes": NotebookPen,
  "content-writer": PenLine,
  "json-formatter": Braces,
  "sql-helper": Database,
};

export default function ToolsPage() {
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [selected, setSelected] = useState<ToolDefinition | null>(null);
  const [values, setValues] = useState<{ input: string; secondary: string }>({ input: "", secondary: "" });
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    NovaApiClient.get<{ tools: ToolDefinition[] }>("/api/tools").then((data) => setTools(data.tools));
  }, []);

  function selectTool(tool: ToolDefinition) {
    setSelected(tool);
    setValues({ input: "", secondary: "" });
    setResult(null);
    setError(null);
  }

  async function handleRun() {
    if (!selected) return;
    setRunning(true);
    setError(null);
    try {
      const data = await NovaApiClient.post<{ result: string }>(`/api/tools/${selected.id}/run`, {
        input: values.input,
        secondary: values.secondary || undefined,
      });
      setResult(data.result);
    } catch (err) {
      setError(err instanceof NovaApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <ChatShell>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex h-14 flex-none items-center gap-2 border-b border-border px-4 sm:px-6">
          {selected && (
            <button
              onClick={() => setSelected(null)}
              aria-label="Back to tools"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-text"
            >
              <ArrowLeft size={15} />
            </button>
          )}
          <h1 className="text-sm font-medium text-text">{selected ? selected.label : "AI Tools"}</h1>
        </header>

        {!selected ? (
          tools.length === 0 ? (
            <EmptyState icon={Wrench} title="Loading tools..." />
          ) : (
            <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-3 p-6 sm:grid-cols-3">
              {tools.map((tool) => {
                const Icon = ICONS[tool.id] || Wrench;
                return (
                  <button
                    key={tool.id}
                    onClick={() => selectTool(tool)}
                    className="flex flex-col items-start gap-2.5 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:border-accent/40"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-soft text-accent">
                      <Icon size={16} />
                    </div>
                    <p className="text-sm font-medium text-text">{tool.label}</p>
                    <p className="text-xs text-text-secondary">{tool.description}</p>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-0">
            <div className="flex flex-col gap-4">
              {selected.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium uppercase tracking-wide text-muted">
                    {field.label}
                    {field.required && <span className="text-error"> *</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={values[field.key]}
                      onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      rows={6}
                      className="mt-2 w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                  ) : (
                    <input
                      value={values[field.key]}
                      onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="mt-2 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                  )}
                </div>
              ))}

              <Button
                onClick={handleRun}
                loading={running}
                disabled={!values.input.trim()}
                className="w-full sm:w-auto"
              >
                {running ? "Generating..." : "Generate"}
              </Button>

              {error && (
                <p role="alert" className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
                  {error}
                </p>
              )}

              {result && (
                <div className="rounded-md border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">Result</p>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs text-muted hover:text-text"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text">{result}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ChatShell>
  );
}
