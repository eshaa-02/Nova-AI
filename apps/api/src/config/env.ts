import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be a long random string"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be a long random string"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  COOKIE_SECRET: z.string().min(16, "COOKIE_SECRET must be a long random string"),

  AI_PROVIDER: z.enum(["google", "groq", "openai", "anthropic", "mock"]).default("mock"),

  GOOGLE_API_KEY: z.string().optional().default(""),
  GOOGLE_MODEL: z.string().optional().default("gemini-2.5-flash"),
  GOOGLE_IMAGE_MODEL: z.string().optional().default(""),

  GROQ_API_KEY: z.string().optional().default(""),
  GROQ_MODEL: z.string().optional().default("llama-3.3-70b-versatile"),

  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().optional().default(""),

  ANTHROPIC_API_KEY: z.string().optional().default(""),
  ANTHROPIC_MODEL: z.string().optional().default(""),

  // tavily | none  (none returns a clear "not configured" error, never fake results)
  SEARCH_PROVIDER: z.enum(["tavily", "none"]).default("none"),
  TAVILY_API_KEY: z.string().optional().default(""),

  // runway | none — video generation isn't implemented for any vendor yet
  // (see services/video/providers/RunwayProvider.ts); this only gates
  // which honest error the API returns.
  VIDEO_PROVIDER: z.enum(["runway", "none"]).default("none"),
  RUNWAY_API_KEY: z.string().optional().default(""),

  // suno | none — music generation isn't implemented for any vendor yet
  // (see services/music/providers/SunoProvider.ts); same gating role as above.
  MUSIC_PROVIDER: z.enum(["suno", "none"]).default("none"),
  SUNO_API_KEY: z.string().optional().default(""),

  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(15),

  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default("Nova AI <no-reply@nova.ai>"),

  GOOGLE_OAUTH_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional().default(""),
  GITHUB_OAUTH_CLIENT_ID: z.string().optional().default(""),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loud in a readable way rather than crashing deep in some
  // unrelated module the first time an unset variable is dereferenced.
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

if (isProduction && env.AI_PROVIDER === "mock") {
  console.error("❌ AI_PROVIDER=mock is not allowed in production. Configure a real provider.");
  process.exit(1);
}

if (env.AI_PROVIDER === "google" && !env.GOOGLE_API_KEY) {
  console.warn(
    "⚠️  AI_PROVIDER=google but GOOGLE_API_KEY is not set. Gemini requests will fail until it is configured."
  );
}

if (env.AI_PROVIDER === "groq" && !env.GROQ_API_KEY) {
  console.warn(
    "⚠️ AI_PROVIDER=groq but GROQ_API_KEY is not set. Groq requests will fail until it is configured."
  );
}

if (env.SEARCH_PROVIDER === "tavily" && !env.TAVILY_API_KEY) {
  console.warn(
    "⚠️  SEARCH_PROVIDER=tavily but TAVILY_API_KEY is not set. Web search requests will fail until it is configured."
  );
}
