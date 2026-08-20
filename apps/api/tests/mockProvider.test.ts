import { describe, it, expect } from "vitest";
import { MockProvider } from "../src/services/ai/providers/MockProvider";

describe("MockProvider", () => {
  it("streams non-empty chunks that concatenate into a final response", async () => {
    const provider = new MockProvider();
    let full = "";
    for await (const chunk of provider.streamChat({ history: [{ role: "user", content: "Hello" }] })) {
      full += chunk.delta;
    }
    expect(full.length).toBeGreaterThan(0);
    expect(full).toContain("mock response");
  });

  it("respects an abort signal and stops yielding further chunks", async () => {
    const provider = new MockProvider();
    const controller = new AbortController();
    let count = 0;

    for await (const _ of provider.streamChat({
      history: [{ role: "user", content: "Count to a hundred" }],
      signal: controller.signal,
    })) {
      count++;
      if (count === 2) controller.abort();
    }

    // Loop should exit promptly after abort rather than exhausting the whole reply.
    expect(count).toBeLessThan(50);
  });
});
