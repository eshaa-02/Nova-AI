"use client";

import { create } from "zustand";
import type { SearchResult } from "@nova-ai/shared";
import { NovaApiClient, NovaApiError } from "@/lib/api/client";

interface SearchState {
  result: SearchResult | null;
  loading: boolean;
  error: string | null;
  runSearch: (query: string) => Promise<void>;
}

export const useSearchStore = create<SearchState>((set) => ({
  result: null,
  loading: false,
  error: null,

  runSearch: async (query) => {
    set({ loading: true, error: null });
    try {
      const data = await NovaApiClient.get<SearchResult>(`/api/search?q=${encodeURIComponent(query)}`);
      set({ result: data, loading: false });
    } catch (err) {
      const message = err instanceof NovaApiError ? err.message : "Search failed. Please try again.";
      set({ error: message, loading: false, result: null });
    }
  },
}));
