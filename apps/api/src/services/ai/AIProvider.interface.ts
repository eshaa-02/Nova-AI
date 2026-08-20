export interface ChatHistoryTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamChatOptions {
  history: ChatHistoryTurn[];
  systemPrompt?: string;
  /** AbortSignal lets the caller implement "Stop generating". */
  signal?: AbortSignal;
}

export interface StreamChunk {
  delta: string;
}

export interface ProviderCapabilities {
  streaming: boolean;
  vision: boolean;
  imageGeneration: boolean;
  imageEditing: boolean;
}

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: "1:1" | "4:5" | "16:9" | "9:16";
  count?: number;
}

export interface EditImageOptions {
  imageBase64: string;
  mimeType: string;
  prompt: string;
}

export interface GeneratedImageData {
  base64: string;
  mimeType: string;
}

/**
 * Every AI provider (Google, OpenAI, Anthropic, Mock) implements this
 * interface. Controllers and socket handlers depend only on this
 * contract — never on a specific provider's SDK — so swapping
 * AI_PROVIDER in the environment requires no application code changes.
 */
export interface AIProvider {
  readonly name: "google" | "groq" | "openai" | "anthropic" | "mock";
  readonly model: string;
  readonly capabilities: ProviderCapabilities;

  /**
   * Streams a chat completion as an async generator of text deltas.
   * Implementations must respect `options.signal` for cancellation.
   */
  streamChat(options: StreamChatOptions): AsyncGenerator<StreamChunk, void, void>;

  /** Non-streaming convenience wrapper, used where streaming isn't needed. */
  generateText(options: StreamChatOptions): Promise<string>;

  /** Only implemented by providers where `capabilities.imageGeneration` is true. */
  generateImage?(options: GenerateImageOptions): Promise<GeneratedImageData[]>;

  /** Only implemented by providers where `capabilities.imageEditing` is true. */
  editImage?(options: EditImageOptions): Promise<GeneratedImageData>;
}

export class ProviderCapabilityError extends Error {
  constructor(providerName: string, capability: string) {
    super(`Provider "${providerName}" does not support "${capability}".`);
    this.name = "ProviderCapabilityError";
  }
}
