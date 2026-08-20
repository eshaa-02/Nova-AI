"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Zap, Brain, Sparkles, Palette } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NovaApiClient } from "@/lib/api/client";
import type { ModelOption, ModelTier } from "@nova-ai/shared";

const tierIcons: Record<ModelTier, typeof Zap> = {
  fast: Zap,
  balanced: Sparkles,
  reasoning: Brain,
  creative: Palette,
};

export function ModelSelector({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (modelId: string) => void;
}) {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    NovaApiClient.get<{ models: ModelOption[] }>("/api/users/models")
      .then((data) => setModels(data.models))
      .catch(() => setModels([]));
  }, []);

  const selected = models.find((m) => m.id === value) || models[0];

  if (!selected) {
    return <div className="h-9 w-32 animate-pulse-soft rounded-md bg-surface" />;
  }

  const Icon = tierIcons[selected.tier];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text hover:bg-surface-elevated"
      >
        <Icon size={14} className="text-accent" />
        {selected.label}
        <ChevronDown size={14} className="text-muted" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-11 z-20 w-72 overflow-hidden rounded-md border border-border bg-surface-elevated shadow-nova-md animate-fade-in"
        >
          {models.map((m) => {
            const ItemIcon = tierIcons[m.tier];
            return (
              <button
                key={m.id}
                role="option"
                aria-selected={selected.id === m.id}
                onClick={() => {
                  onChange?.(m.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-surface",
                  selected.id === m.id && "bg-accent-soft/50"
                )}
              >
                <ItemIcon size={15} className="mt-0.5 flex-none text-accent" />
                <div className="min-w-0">
                  <p className="text-sm text-text">{m.label}</p>
                  <p className="text-xs text-text-secondary">{m.description}</p>
                </div>
              </button>
            );
          })}

          <div className="border-t border-border px-3.5 py-2.5">
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-xs text-muted hover:text-text-secondary"
            >
              {showAdvanced ? "Hide" : "Show"} provider details
            </button>
            {showAdvanced && (
              <p className="mt-1.5 text-xs text-muted">
                Provider: {selected.provider} · Model: {selected.providerModel}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
