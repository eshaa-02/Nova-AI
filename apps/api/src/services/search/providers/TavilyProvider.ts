import type { SearchProvider, SearchProviderResult } from "../SearchProvider.interface";
import { ApiError } from "../../../utils/ApiError";

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

/**
 * Real integration with Tavily (https://tavily.com), an AI-oriented search
 * API that returns cited sources plus an optional synthesized answer —
 * a good fit for grounding AI search results without fabricating citations.
 */
export class TavilyProvider implements SearchProvider {
  readonly name = "tavily" as const;
  readonly configured: boolean;

  constructor(private apiKey: string) {
    this.configured = Boolean(apiKey);
  }

  async search(query: string): Promise<SearchProviderResult> {
    if (!this.configured) {
      throw ApiError.serviceUnavailable(
        "Web search is not configured. Set SEARCH_PROVIDER=tavily and TAVILY_API_KEY."
      );
    }

    let res: Response;
    try {
      res = await fetch(TAVILY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          include_answer: true,
          max_results: 6,
        }),
      });
    } catch {
      throw ApiError.serviceUnavailable("Unable to reach the search provider. Please try again.");
    }

    if (res.status === 401 || res.status === 403) {
      throw ApiError.serviceUnavailable("The search provider rejected the configured API key.");
    }
    if (res.status === 429) {
      throw ApiError.tooManyRequests("The search provider is rate-limited. Please try again shortly.");
    }
    if (!res.ok) {
      throw ApiError.serviceUnavailable("Web search is temporarily unavailable.");
    }

    const data = (await res.json()) as {
      answer?: string;
      results: { title: string; url: string; content: string }[];
    };

    return {
      answer: data.answer,
      sources: data.results.map((r) => ({ title: r.title, url: r.url, snippet: r.content })),
    };
  }
}
