import type { GenerateMusicOptions, GeneratedMusicData, MusicProvider } from "../MusicProvider.interface";
import { ApiError } from "../../../utils/ApiError";

/**
 * Placeholder for a real music-generation vendor (e.g. Suno). Wired into
 * the factory/interface so choosing MUSIC_PROVIDER=suno routes here, but
 * the actual API integration isn't implemented — like video generation,
 * these APIs are typically async/task-based. Implementing this for real
 * means: submit `options` to the vendor's generation endpoint, poll for
 * completion, download the resulting audio, and return it as
 * { base64, mimeType } here. Until then this throws a clear error rather
 * than fabricating a response.
 */
export class SunoProvider implements MusicProvider {
  readonly name = "suno";
  readonly configured: boolean;

  constructor(private apiKey: string) {
    this.configured = Boolean(apiKey);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateMusic(_options: GenerateMusicOptions): Promise<GeneratedMusicData> {
    throw ApiError.serviceUnavailable(
      "The Suno music provider is not yet implemented in this deployment."
    );
  }
}
