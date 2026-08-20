/**
 * Friendly model categories shown to end users in the model selector.
 * These map to a real provider/model configured on the backend —
 * the frontend never hard-codes an actual provider model name.
 */
export type ModelTier = "fast" | "balanced" | "reasoning" | "creative";

export interface ModelOption {
  id: string;
  tier: ModelTier;
  label: string;
  description: string;
  /** Actual provider/model string, only surfaced in an "advanced details" view. */
  providerModel: string;
  provider: "google" | "groq" | "openai" | "anthropic" | "mock";
  capabilities: {
    streaming: boolean;
    vision: boolean;
    imageGeneration: boolean;
  };
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  systemPrompt?: string;
  isPinned: boolean;
  isArchived: boolean;
  folder?: string;
  lastMessagePreview?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationPayload {
  title?: string;
  model?: string;
  systemPrompt?: string;
}

export interface UpdateConversationPayload {
  title?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  folder?: string;
  model?: string;
}
