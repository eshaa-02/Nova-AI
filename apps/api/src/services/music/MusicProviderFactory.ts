import { env } from "../../config/env";
import type { MusicProvider } from "./MusicProvider.interface";
import { SunoProvider } from "./providers/SunoProvider";
import { NoMusicProvider } from "./providers/NoMusicProvider";

let cached: MusicProvider | null = null;

export function getMusicProvider(): MusicProvider {
  if (cached) return cached;
  cached = env.MUSIC_PROVIDER === "suno" ? new SunoProvider(env.SUNO_API_KEY) : new NoMusicProvider();
  return cached;
}
