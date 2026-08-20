import type { GenerateVideoOptions, GeneratedVideoData, VideoProvider } from "../VideoProvider.interface";
import { ApiError } from "../../../utils/ApiError";

/**
 * Placeholder for a real video-generation vendor (e.g. Runway). Wired
 * into the factory/interface so choosing VIDEO_PROVIDER=runway routes
 * here, but the actual API integration isn't implemented — video
 * generation APIs are typically async/task-based (submit a job, poll
 * for completion), so implementing this for real means: call the
 * vendor's create-generation endpoint with `options`, poll its status
 * endpoint until the job completes, download the result, and return it
 * as { base64, mimeType } here. Until then this throws a clear error
 * rather than fabricating a response.
 */
export class RunwayProvider implements VideoProvider {
  readonly name = "runway";
  readonly configured: boolean;

  constructor(private apiKey: string) {
    this.configured = Boolean(apiKey);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async generateVideo(_options: GenerateVideoOptions): Promise<GeneratedVideoData> {
    throw ApiError.serviceUnavailable(
      "The Runway video provider is not yet implemented in this deployment."
    );
  }
}
