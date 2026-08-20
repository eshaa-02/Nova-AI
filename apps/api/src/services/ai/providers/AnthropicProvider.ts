import type {
  AIProvider,
  ProviderCapabilities,
  StreamChatOptions,
  StreamChunk,
} from "../AIProvider.interface";
import { ApiError } from "../../../utils/ApiError";

/**
 * Placeholder Anthropic provider. Same status as OpenAIProvider — wired
 * into the factory/interface but not implemented, since Gemini is this
 * deployment's verified provider. Implement `streamChat` with the
 * `@anthropic-ai/sdk` streaming Messages API to activate it.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const;
  readonly model: string;
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    vision: true,
    imageGeneration: false,
    imageEditing: false,
  };

  constructor(apiKey: string, model: string) {
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required to construct AnthropicProvider");
    this.model = model;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async *streamChat(_options: StreamChatOptions): AsyncGenerator<StreamChunk, void, void> {
    throw ApiError.serviceUnavailable(
      "The Anthropic provider is not yet implemented in this deployment. Set AI_PROVIDER=google to use Gemini."
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
