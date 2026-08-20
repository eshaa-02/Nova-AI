import { env } from "../../config/env";
import { getAIProvider } from "./AIProviderFactory";
import type { ModelOption } from "@nova-ai/shared";

/**
 * Maps the single configured provider/model onto the friendly tiers the
 * chat UI shows ("Nova", "Fast", "Reasoning", "Creative"). Advanced users
 * can see the real provider/model string via `providerModel`. Nothing
 * here is hard-coded to an obsolete model name — it reads from env.
 */
export function getAvailableModels(): ModelOption[] {
  const provider = getAIProvider();
  const providerModel = provider.model;

  const base: Omit<ModelOption, "id" | "tier" | "label" | "description"> = {
    providerModel,
    provider: provider.name,
    capabilities: provider.capabilities,
  };

  if (env.NODE_ENV !== "production" && provider.name === "mock") {
    return [
      {
        id: "nova-mock",
        tier: "balanced",
        label: "Nova (dev mock)",
        description: "Development fallback — no real AI provider configured.",
        ...base,
      },
    ];
  }

  // A single configured provider currently backs every tier — they route
  // to the same model but let the UI express user intent. When multiple
  // real models are wired up, map each tier to a distinct provider/model.
  return [
    {
      id: "nova-balanced",
      tier: "balanced",
      label: "Nova",
      description: "Well-rounded for everyday questions, writing, and analysis.",
      ...base,
    },
    {
      id: "nova-fast",
      tier: "fast",
      label: "Fast",
      description: "Optimized for quick, lightweight responses.",
      ...base,
    },
    {
      id: "nova-reasoning",
      tier: "reasoning",
      label: "Reasoning",
      description: "Best for multi-step problems, math, and code.",
      ...base,
    },
    {
      id: "nova-creative",
      tier: "creative",
      label: "Creative",
      description: "Tuned for brainstorming and creative writing.",
      ...base,
    },
  ];
}
