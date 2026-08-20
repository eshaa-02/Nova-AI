import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  AIProvider,
  ChatHistoryTurn,
  EditImageOptions,
  GenerateImageOptions,
  GeneratedImageData,
  ProviderCapabilities,
  StreamChatOptions,
  StreamChunk,
} from "../AIProvider.interface";
import { ApiError } from "../../../utils/ApiError";

const GEMINI_REST_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Real Google Gemini integration. Requires GOOGLE_API_KEY.
 * The model name is fully configurable via GOOGLE_MODEL — never
 * hard-code a specific Gemini model version here.
 */
export class GoogleProvider implements AIProvider {
  readonly name = "google" as const;
  readonly model: string;
  readonly capabilities: ProviderCapabilities;

  private client: GoogleGenerativeAI;
  private apiKey: string;
  private imageModel: string;

  constructor(apiKey: string, model: string, imageModel?: string) {
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is required to construct GoogleProvider");
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.apiKey = apiKey;
    this.model = model;
    this.imageModel = imageModel || "";
    this.capabilities = {
      streaming: true,
      vision: true,
      imageGeneration: Boolean(this.imageModel),
      imageEditing: Boolean(this.imageModel),
    };
  }

  private buildModel(systemPrompt?: string) {
    return this.client.getGenerativeModel({
      model: this.model,
      ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
    });
  }

  /** Gemini expects alternating user/model turns; map our roles + merge the trailing user turn. */
  private toGeminiHistory(history: ChatHistoryTurn[]) {
    const nonSystem = history.filter((t) => t.role !== "system");
    const priorTurns = nonSystem.slice(0, -1).map((t) => ({
      role: t.role === "assistant" ? "model" : "user",
      parts: [{ text: t.content }],
    }));
    const lastTurn = nonSystem[nonSystem.length - 1];
    return { priorTurns, lastMessage: lastTurn?.content ?? "" };
  }

  async *streamChat(options: StreamChatOptions): AsyncGenerator<StreamChunk, void, void> {
    const { history, systemPrompt, signal } = options;
    const model = this.buildModel(systemPrompt);
    const { priorTurns, lastMessage } = this.toGeminiHistory(history);

    try {
      const chat = model.startChat({ history: priorTurns });
      const result = await chat.sendMessageStream(lastMessage);

      for await (const chunk of result.stream) {
        if (signal?.aborted) return;
        const text = chunk.text();
        if (text) yield { delta: text };
      }
    } catch (err) {
      console.error("GEMINI REAL ERROR:", err);
      throw mapGoogleError(err);
    }
  }

  async generateText(options: StreamChatOptions): Promise<string> {
    let full = "";
    for await (const chunk of this.streamChat(options)) {
      full += chunk.delta;
    }
    return full;
  }
  /**
   * Generates images via Gemini's native image-output capability
   * (a model whose response can include inline image parts, configured
   * via GOOGLE_IMAGE_MODEL — e.g. a "*-image" / "*-image-preview" model).
   * Called via plain REST rather than the SDK's typed helpers since
   * multimodal image-output response shapes vary faster than the SDK
   * ships typings for them; a raw fetch stays correct across SDK versions.
   */
  async generateImage(options: GenerateImageOptions): Promise<GeneratedImageData[]> {
    if (!this.imageModel) {
      throw ApiError.serviceUnavailable(
        "Image generation is not configured. Set GOOGLE_IMAGE_MODEL to a Gemini model that supports image output."
      );
    }

    const count = Math.min(Math.max(options.count ?? 1, 1), 4);
    const aspectHint = options.aspectRatio ? ` Aspect ratio: ${options.aspectRatio}.` : "";
    const prompt = `${options.prompt}${aspectHint}`;

    const results: GeneratedImageData[] = [];

    // Generated one request at a time rather than in parallel to stay
    // comfortably under per-minute rate limits on typical free-tier keys.
    for (let i = 0; i < count; i++) {
      let res: Response;
      try {
        res = await fetch(
          `${GEMINI_REST_BASE}/${this.imageModel}:generateContent?key=${this.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
            }),
          }
        );
      } catch {
        throw ApiError.serviceUnavailable("Unable to reach the image generation provider.");
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw mapGoogleError(new Error(`${res.status} ${body}`));
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType: string } }[] } }[];
      };

      const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (!imagePart?.inlineData) {
        throw ApiError.internal("The AI provider returned no image data. Please try again.");
      }

      results.push({ base64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType });
    }

    return results;
  }

  /**
   * Edits an existing image using the same image-output-capable model,
   * given an input image plus an instruction (e.g. "remove the
   * background", "enhance lighting and sharpness", or a free-form edit).
   */
  async editImage(options: EditImageOptions): Promise<GeneratedImageData> {
    if (!this.imageModel) {
      throw ApiError.serviceUnavailable(
        "Image editing is not configured. Set GOOGLE_IMAGE_MODEL to a Gemini model that supports image output."
      );
    }

    let res: Response;
    try {
      res = await fetch(`${GEMINI_REST_BASE}/${this.imageModel}:generateContent?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { data: options.imageBase64, mimeType: options.mimeType } },
                { text: options.prompt },
              ],
            },
          ],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
      });
    } catch {
      throw ApiError.serviceUnavailable("Unable to reach the image editing provider.");
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw mapGoogleError(new Error(`${res.status} ${body}`));
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType: string } }[] } }[];
    };

    const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart?.inlineData) {
      throw ApiError.internal("The AI provider returned no image data. Please try again.");
    }

    return { base64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType };
  }
}

function mapGoogleError(err: unknown): ApiError {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (lower.includes("api key") || lower.includes("permission") || lower.includes("unauthorized")) {
    return ApiError.serviceUnavailable(
      "The AI provider rejected the configured API key. Check GOOGLE_API_KEY."
    );
  }
  if (
    lower.includes("not found") ||
    lower.includes("404") ||
    lower.includes("not supported for generatecontent")
  ) {
    return ApiError.serviceUnavailable(
      "The configured Gemini model is unavailable. Check GOOGLE_MODEL against models available to your key."
    );
  }
  if (lower.includes("quota") || lower.includes("rate") || lower.includes("429")) {
    return ApiError.tooManyRequests("The AI provider is rate-limited. Please try again shortly.");
  }
  if (lower.includes("timeout") || lower.includes("deadline")) {
    return ApiError.serviceUnavailable("The AI provider timed out. Please try again.");
  }
  return ApiError.serviceUnavailable("AI model temporarily unavailable.");
}
