import Groq from "groq-sdk";
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

export class GroqProvider implements AIProvider {
    readonly name = "groq" as const;
    readonly model: string;

    readonly capabilities: ProviderCapabilities = {
        streaming: true,
        vision: false,
        imageGeneration: false,
        imageEditing: false,
    };

    private client: Groq;

    constructor(apiKey: string, model: string) {
        if (!apiKey) {
            throw new Error("GROQ_API_KEY is required to construct GroqProvider");
        }

        this.client = new Groq({
            apiKey,
        });

        this.model = model;
    }

    async *streamChat(
        options: StreamChatOptions
    ): AsyncGenerator<StreamChunk, void, void> {
        const { history, systemPrompt, signal } = options;

        const messages: any[] = [];

        if (systemPrompt) {
            messages.push({
                role: "system",
                content: systemPrompt,
            });
        }

        for (const turn of history) {
            if (turn.role === "system") continue;

            messages.push({
                role: turn.role === "assistant" ? "assistant" : "user",
                content: turn.content,
            });
        }

        try {
            const stream = await this.client.chat.completions.create({
                model: this.model,
                messages,
                stream: true,
            });

            for await (const chunk of stream) {
                if (signal?.aborted) return;

                const text = chunk.choices[0]?.delta?.content;

                if (text) {
                    yield { delta: text };
                }
            }
        } catch (err) {
            throw mapGroqError(err);
        }
    }

    async generateText(options: StreamChatOptions): Promise<string> {
        let full = "";

        for await (const chunk of this.streamChat(options)) {
            full += chunk.delta;
        }

        return full;
    }

    async generateImage(
        _options: GenerateImageOptions
    ): Promise<GeneratedImageData[]> {
        throw ApiError.serviceUnavailable(
            "Image generation is not available with the Groq chat provider. Configure a separate image provider."
        );
    }

    async editImage(
        _options: EditImageOptions
    ): Promise<GeneratedImageData> {
        throw ApiError.serviceUnavailable(
            "AI image editing is not available with the Groq chat provider. Configure a separate image provider."
        );
    }
}

function mapGroqError(err: unknown): ApiError {
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();

    console.error("GROQ REAL ERROR:", err);

    if (
        lower.includes("api key") ||
        lower.includes("authentication") ||
        lower.includes("unauthorized") ||
        lower.includes("401")
    ) {
        return ApiError.serviceUnavailable(
            "The AI provider rejected the configured Groq API key. Check GROQ_API_KEY."
        );
    }

    if (
        lower.includes("model") ||
        lower.includes("not found")
    ) {
        return ApiError.serviceUnavailable(
            "The configured Groq model is unavailable. Check GROQ_MODEL."
        );
    }

    if (
        lower.includes("quota") ||
        lower.includes("rate") ||
        lower.includes("429")
    ) {
        return ApiError.tooManyRequests(
            "Groq is rate-limited. Please try again shortly."
        );
    }

    return ApiError.serviceUnavailable(
        "Groq AI model temporarily unavailable."
    );
}