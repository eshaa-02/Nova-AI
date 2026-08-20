import { describe, it, expect } from "vitest";
import { GoogleProvider } from "../src/services/ai/providers/GoogleProvider";

describe("GoogleProvider image generation capability", () => {
  it("reports imageGeneration=false when no GOOGLE_IMAGE_MODEL is configured", () => {
    const provider = new GoogleProvider("fake-key", "gemini-2.5-flash");
    expect(provider.capabilities.imageGeneration).toBe(false);
  });

  it("reports imageGeneration=true when GOOGLE_IMAGE_MODEL is configured", () => {
    const provider = new GoogleProvider("fake-key", "gemini-2.5-flash", "gemini-2.5-flash-image");
    expect(provider.capabilities.imageGeneration).toBe(true);
  });

  it("rejects generateImage without hitting the network when unconfigured", async () => {
    const provider = new GoogleProvider("fake-key", "gemini-2.5-flash");
    await expect(provider.generateImage({ prompt: "a cat" })).rejects.toThrow(/not configured/i);
  });
});
