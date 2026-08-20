import { describe, it, expect } from "vitest";
import { TOOLS, getToolById } from "../src/services/tools/tools.catalog";

describe("tools catalog", () => {
  it("includes all 11 spec'd tools with a unique id each", () => {
    expect(TOOLS).toHaveLength(11);
    const ids = new Set(TOOLS.map((t) => t.id));
    expect(ids.size).toBe(TOOLS.length);
  });

  it("every tool has at least a required input field", () => {
    for (const tool of TOOLS) {
      const inputField = tool.fields.find((f) => f.key === "input");
      expect(inputField).toBeDefined();
      expect(inputField?.required).toBe(true);
    }
  });

  it("builds a prompt that includes the user's input text", () => {
    const summarizer = getToolById("summarizer")!;
    const prompt = summarizer.buildPrompt({ input: "The quick brown fox." });
    expect(prompt).toContain("The quick brown fox.");
  });

  it("translator prompt includes the target language", () => {
    const translator = getToolById("translator")!;
    const prompt = translator.buildPrompt({ input: "Hello", secondary: "Spanish" });
    expect(prompt).toContain("Spanish");
    expect(prompt).toContain("Hello");
  });

  it("returns undefined for an unknown tool id", () => {
    expect(getToolById("not-a-real-tool")).toBeUndefined();
  });
});
