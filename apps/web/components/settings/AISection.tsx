"use client";

import { useEffect, useState } from "react";
import type { ModelOption } from "@nova-ai/shared";
import { NovaApiClient } from "@/lib/api/client";

export function AISection() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    NovaApiClient.get<{ models: ModelOption[] }>("/api/users/models")
      .then((data) => setModels(data.models))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="font-display text-2xl text-text">AI</h2>
      <p className="mt-1 text-sm text-text-secondary">
        The model tiers available in the chat composer, and the provider currently backing them.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {!loading &&
          models.map((m) => (
            <div key={m.id} className="rounded-md border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text">{m.label}</p>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent">
                  {m.provider}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-secondary">{m.description}</p>
              <p className="mt-2 text-xs text-muted">Model: {m.providerModel}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
