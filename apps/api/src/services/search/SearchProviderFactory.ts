import { env } from "../../config/env";
import type { SearchProvider } from "./SearchProvider.interface";
import { TavilyProvider } from "./providers/TavilyProvider";
import { NoSearchProvider } from "./providers/NoSearchProvider";

let cached: SearchProvider | null = null;

export function getSearchProvider(): SearchProvider {
  if (cached) return cached;

  cached =
    env.SEARCH_PROVIDER === "tavily" ? new TavilyProvider(env.TAVILY_API_KEY) : new NoSearchProvider();

  return cached;
}
