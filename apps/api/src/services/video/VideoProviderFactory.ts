import { env } from "../../config/env";
import type { VideoProvider } from "./VideoProvider.interface";
import { RunwayProvider } from "./providers/RunwayProvider";
import { NoVideoProvider } from "./providers/NoVideoProvider";

let cached: VideoProvider | null = null;

export function getVideoProvider(): VideoProvider {
  if (cached) return cached;
  cached = env.VIDEO_PROVIDER === "runway" ? new RunwayProvider(env.RUNWAY_API_KEY) : new NoVideoProvider();
  return cached;
}
