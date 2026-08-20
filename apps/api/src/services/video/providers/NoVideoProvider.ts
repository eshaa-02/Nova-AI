import type { VideoProvider } from "../VideoProvider.interface";
import { ApiError } from "../../../utils/ApiError";

export class NoVideoProvider implements VideoProvider {
  readonly name = "none";
  readonly configured = false;

  async generateVideo(): Promise<never> {
    throw ApiError.serviceUnavailable(
      "Video generation isn't configured yet. Set VIDEO_PROVIDER and its API key to enable it."
    );
  }
}
