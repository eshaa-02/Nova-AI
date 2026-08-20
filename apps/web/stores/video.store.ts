"use client";

import { create } from "zustand";
import type { GeneratedVideo } from "@nova-ai/shared";
import { NovaApiClient, NovaApiError } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

interface VideoState {
  videos: GeneratedVideo[];
  generating: boolean;
  loadHistory: () => Promise<void>;
  generate: (params: { prompt: string; style?: string; durationSeconds: number; aspectRatio: GeneratedVideo["aspectRatio"] }) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  generating: false,

  loadHistory: async () => {
    const data = await NovaApiClient.get<{ videos: GeneratedVideo[] }>("/api/videos");
    set({ videos: data.videos });
  },

  generate: async (params) => {
    set({ generating: true });
    try {
      const data = await NovaApiClient.post<{ video: GeneratedVideo }>("/api/videos", params);
      set((s) => ({ videos: [data.video, ...s.videos] }));

      const poll = async () => {
        const fresh = await NovaApiClient.get<{ videos: GeneratedVideo[] }>("/api/videos");
        const match = fresh.videos.find((v) => v.id === data.video.id);
        set((s) => ({ videos: s.videos.map((v) => (v.id === data.video.id ? match || v : v)) }));
        if (match && match.status === "generating") {
          setTimeout(poll, 2000);
        } else {
          set({ generating: false });
        }
      };
      setTimeout(poll, 2000);
    } catch (err) {
      const message = err instanceof NovaApiError ? err.message : "Couldn't start generation.";
      useToastStore.getState().show(message, "error");
      set({ generating: false });
      throw err;
    }
  },

  deleteVideo: async (id) => {
    await NovaApiClient.delete(`/api/videos/${id}`);
    set((s) => ({ videos: s.videos.filter((v) => v.id !== id) }));
  },
}));
