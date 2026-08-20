import type { MusicProvider } from "../MusicProvider.interface";
import { ApiError } from "../../../utils/ApiError";

export class NoMusicProvider implements MusicProvider {
  readonly name = "none";
  readonly configured = false;

  async generateMusic(): Promise<never> {
    throw ApiError.serviceUnavailable(
      "Music generation isn't configured yet. Set MUSIC_PROVIDER and its API key to enable it."
    );
  }
}
