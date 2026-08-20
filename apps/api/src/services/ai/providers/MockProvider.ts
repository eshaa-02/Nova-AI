import type {
  AIProvider,
  ProviderCapabilities,
  StreamChatOptions,
  StreamChunk,
} from "../AIProvider.interface";

/**
 * Development-only fallback so the app is runnable without any API key.
 * Blocked from production by config/env.ts. Clearly labeled in the UI
 * (model shows as "Mock (dev only)") so nobody mistakes it for a real answer.
 */
export class MockProvider implements AIProvider {
  readonly name = "mock" as const;
  readonly model = "nova-mock-dev";
  readonly capabilities: ProviderCapabilities = {
    streaming: true,
    vision: false,
    imageGeneration: false,
    imageEditing: false,
  };

  async *streamChat(options: StreamChatOptions): AsyncGenerator<StreamChunk, void, void> {
    const lastUserMessage = [...options.history].reverse().find((t) => t.role === "user");
    const reply =
      `This is a **development mock response** — no real AI provider is configured.\n\n` +
      `You said: "${lastUserMessage?.content ?? ""}"\n\n` +
      `Set \`AI_PROVIDER=google\` and \`GOOGLE_API_KEY\` in \`apps/api/.env\` to get real answers from Gemini.`;

    const words = reply.split(" ");
    for (const word of words) {
      if (options.signal?.aborted) return;
      await new Promise((r) => setTimeout(r, 15));
      yield { delta: word + " " };
    }
  }

  async generateText(options: StreamChatOptions): Promise<string> {
    let full = "";
    for await (const chunk of this.streamChat(options)) {
      full += chunk.delta;
    }
    return full;
  }
}
