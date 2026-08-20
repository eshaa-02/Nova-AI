import { describe, it, expect } from "vitest";
import { GoogleProvider } from "../src/services/ai/providers/GoogleProvider";

describe("GoogleProvider image editing capability", () => {
  it("reports imageEditing=false when no GOOGLE_IMAGE_MODEL is configured", () => {
    const provider = new GoogleProvider("fake-key", "gemini-2.5-flash");
    expect(provider.capabilities.imageEditing).toBe(false);
  });

  it("reports imageEditing=true when GOOGLE_IMAGE_MODEL is configured", () => {
    const provider = new GoogleProvider("fake-key", "gemini-2.5-flash", "gemini-2.5-flash-image");
    expect(provider.capabilities.imageEditing).toBe(true);
  });

  it("rejects editImage without hitting the network when unconfigured", async () => {
    const provider = new GoogleProvider("fake-key", "gemini-2.5-flash");
    await expect(
      provider.editImage!({ imageBase64: "abc", mimeType: "image/png", prompt: "remove background" })
    ).rejects.toThrow(/not configured/i);
  });
});
