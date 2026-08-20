import { describe, it, expect } from "vitest";
import { NoVideoProvider } from "../src/services/video/providers/NoVideoProvider";
import { RunwayProvider } from "../src/services/video/providers/RunwayProvider";
import { NoMusicProvider } from "../src/services/music/providers/NoMusicProvider";
import { SunoProvider } from "../src/services/music/providers/SunoProvider";

describe("video/music provider honesty", () => {
  it("NoVideoProvider always rejects rather than returning fake video data", async () => {
    const provider = new NoVideoProvider();
    expect(provider.configured).toBe(false);
    await expect(provider.generateVideo()).rejects.toThrow(/not configured/i);
  });

  it("RunwayProvider is marked unconfigured without a key and rejects clearly", async () => {
    const provider = new RunwayProvider("");
    expect(provider.configured).toBe(false);
    await expect(
      provider.generateVideo({ prompt: "a sunrise over mountains" })
    ).rejects.toThrow(/not yet implemented/i);
  });

  it("NoMusicProvider always rejects rather than returning fake audio data", async () => {
    const provider = new NoMusicProvider();
    expect(provider.configured).toBe(false);
    await expect(provider.generateMusic()).rejects.toThrow(/not configured/i);
  });

  it("SunoProvider is marked unconfigured without a key and rejects clearly", async () => {
    const provider = new SunoProvider("");
    expect(provider.configured).toBe(false);
    await expect(provider.generateMusic({ prompt: "a lo-fi beat" })).rejects.toThrow(/not yet implemented/i);
  });
});
