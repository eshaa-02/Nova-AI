"use client";

import { useState, type FormEvent } from "react";
import { Search as SearchIcon, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSearchStore } from "@/stores/search.store";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { result, loading, error, runSearch } = useSearchStore();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) runSearch(query.trim());
  }

  return (
    <ChatShell>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex h-14 flex-none items-center border-b border-border px-4 sm:px-6">
          <h1 className="text-sm font-medium text-text">Search</h1>
        </header>

        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-nova-sm focus-within:border-accent/50">
            <SearchIcon size={16} className="flex-none text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything..."
              aria-label="Search query"
              className="flex-1 bg-transparent text-[15px] text-text placeholder:text-muted focus:outline-none"
            />
          </form>

          <div className="mt-8">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={22} className="animate-spin text-accent" />
              </div>
            )}

            {!loading && error && (
              <div className="flex items-start gap-2 rounded-md border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
                <AlertCircle size={15} className="mt-0.5 flex-none" />
                {error}
              </div>
            )}

            {!loading && !error && !result && (
              <EmptyState
                icon={SearchIcon}
                title="Search the web"
                description="Get a cited, up-to-date answer pulled from real sources."
              />
            )}

            {!loading && result && (
              <div className="flex flex-col gap-8">
                {result.answer && (
                  <div className="prose-nova text-[15px]">
                    <p>{result.answer}</p>
                  </div>
                )}

                {result.sources.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Sources</h2>
                    <div className="flex flex-col gap-2">
                      {result.sources.map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-start justify-between gap-3 rounded-md border border-border bg-surface p-3.5 transition-colors hover:border-accent/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-text">{source.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{source.snippet}</p>
                          </div>
                          <ExternalLink size={13} className="mt-0.5 flex-none text-muted group-hover:text-accent" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {result.relatedQuestions.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                      Related questions
                    </h2>
                    <div className="flex flex-col gap-2">
                      {result.relatedQuestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setQuery(q);
                            runSearch(q);
                          }}
                          className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-left text-sm text-text-secondary transition-colors hover:border-accent/40 hover:text-text"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ChatShell>
  );
}
