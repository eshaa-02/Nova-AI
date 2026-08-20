import type { SearchProvider } from "../SearchProvider.interface";
import { ApiError } from "../../../utils/ApiError";

/** Used when SEARCH_PROVIDER=none. Never fabricates sources — errors clearly instead. */
export class NoSearchProvider implements SearchProvider {
  readonly name = "none" as const;
  readonly configured = false;

  async search(): Promise<never> {
    throw ApiError.serviceUnavailable(
      "Web search isn't configured yet. Set SEARCH_PROVIDER=tavily and TAVILY_API_KEY to enable it."
    );
  }
}
