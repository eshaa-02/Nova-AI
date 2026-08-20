import { env } from "../../config/env";
import type { AIProvider } from "./AIProvider.interface";
import { GoogleProvider } from "./providers/GoogleProvider";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { AnthropicProvider } from "./providers/AnthropicProvider";
import { MockProvider } from "./providers/MockProvider";
import { GroqProvider } from "./providers/GroqProvider";

let cachedProvider: AIProvider | null = null;

/**
 * Returns the single AIProvider instance selected by AI_PROVIDER.
 * Controllers/sockets call this instead of importing a specific
 * provider class — swapping providers is a config change only.
 */
export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  switch (env.AI_PROVIDER) {
    case "google":
      cachedProvider = new GoogleProvider(env.GOOGLE_API_KEY, env.GOOGLE_MODEL, env.GOOGLE_IMAGE_MODEL);
      break;
    case "groq":
      cachedProvider = new GroqProvider(
        env.GROQ_API_KEY,
        env.GROQ_MODEL
      );
      break;
    case "openai":
      cachedProvider = new OpenAIProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL);
      break;
    case "anthropic":
      cachedProvider = new AnthropicProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
      break;
    case "mock":
    default:
      cachedProvider = new MockProvider();
      break;
  }

  return cachedProvider;
}

/** Exposed for tests that need to swap the active provider. */
export function __resetProviderCache() {
  cachedProvider = null;
}
