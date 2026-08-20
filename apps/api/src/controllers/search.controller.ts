import type { Request, Response } from "express";
import { z } from "zod";
import { getSearchProvider } from "../services/search/SearchProviderFactory";
import { getAIProvider } from "../services/ai/AIProviderFactory";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "Enter a search query").max(300),
});

export const runSearch = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query as unknown as z.infer<typeof searchQuerySchema>;

  const provider = getSearchProvider();
  const result = await provider.search(q);

  let relatedQuestions: string[] = [];
  if (result.sources.length > 0) {
    try {
      const aiProvider = getAIProvider();
      const sourcesSummary = result.sources
        .slice(0, 4)
        .map((s) => `- ${s.title}: ${s.snippet}`)
        .join("\n");
      const raw = await aiProvider.generateText({
        history: [
          {
            role: "user",
            content:
              `Based on these real search results for "${q}", suggest exactly 4 short, ` +
              `natural follow-up questions a curious reader might ask next. ` +
              `Reply with one question per line, no numbering, no extra text.\n\n${sourcesSummary}`,
          },
        ],
      });
      relatedQuestions = raw
        .split("\n")
        .map((l) => l.replace(/^[-*\d.]+\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 4);
    } catch {
      // Related questions are a nice-to-have; a failure here shouldn't
      // break the actual search results the user asked for.
      relatedQuestions = [];
    }
  }

  sendSuccess(res, {
    query: q,
    answer: result.answer,
    sources: result.sources,
    relatedQuestions,
  });
});
