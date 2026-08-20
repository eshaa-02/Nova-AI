import type {
  AIProvider,
  ProviderCapabilities,
  StreamChatOptions,
  StreamChunk,
} from "../AIProvider.interface";
import { ApiError } from "../../../utils/ApiError";

/**
 * Placeholder OpenAI provider. The abstraction is wired end-to-end
 * (AIProviderFactory will select this when AI_PROVIDER=openai), but the
 * actual OpenAI SDK call is not implemented yet — this repo ships Gemini
 * as the working, verified provider. Implement `streamChat` with the
 * `openai` SDK's streaming chat completions API to activate it, following
 * the exact same shape as GoogleProvider.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  readonly model: string;
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    vision: true,
    // Not yet implemented in this deployment — see class comment.
    imageGeneration: false,
    imageEditing: false,
  };

  constructor(apiKey: string, model: string) {
    if (!apiKey) throw new Error("OPENAI_API_KEY is required to construct OpenAIProvider");
    this.model = model;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async *streamChat(_options: StreamChatOptions): AsyncGenerator<StreamChunk, void, void> {
    throw ApiError.serviceUnavailable(
      "The OpenAI provider is not yet implemented in this deployment. Set AI_PROVIDER=google to use Gemini."
    );
    // eslint-disable-next-line no-unreachable
    yield { delta: "" };
  }

  async generateText(options: StreamChatOptions): Promise<string> {
    let full = "";
    for await (const chunk of this.streamChat(options)) full += chunk.delta;
    return full;
  }
}
