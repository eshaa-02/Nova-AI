export interface GenerateVideoOptions {
  prompt: string;
  style?: string;
  durationSeconds?: number;
  aspectRatio?: "1:1" | "16:9" | "9:16";
}

export interface GeneratedVideoData {
  base64: string;
  mimeType: string;
}

/**
 * Every video provider (a real vendor integration, or the "none"
 * fallback) implements this interface. Controllers depend only on this
 * contract, never a specific vendor's SDK/API shape — the same pattern
 * used for AIProvider and SearchProvider.
 */
export interface VideoProvider {
  readonly name: string;
  readonly configured: boolean;
  generateVideo(options: GenerateVideoOptions): Promise<GeneratedVideoData>;
}
