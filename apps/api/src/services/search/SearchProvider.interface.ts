export interface SearchSourceResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchProviderResult {
  answer?: string;
  sources: SearchSourceResult[];
}

/**
 * Every search provider (Tavily today; others can be added the same way
 * AI providers are) implements this interface. Controllers depend only on
 * this contract, never a specific provider's SDK/API shape.
 */
export interface SearchProvider {
  readonly name: "tavily" | "none";
  readonly configured: boolean;
  search(query: string): Promise<SearchProviderResult>;
}
