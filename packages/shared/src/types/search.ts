export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchResult {
  query: string;
  /** AI-synthesized answer grounded in `sources`. Undefined if the provider only returns links. */
  answer?: string;
  sources: SearchSource[];
  relatedQuestions: string[];
}
