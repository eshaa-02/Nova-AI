"use client";

import { create } from "zustand";
import type { GeneratedMusicTrack } from "@nova-ai/shared";
import { NovaApiClient, NovaApiError } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

interface MusicState {
  tracks: GeneratedMusicTrack[];
  generating: boolean;
  loadHistory: () => Promise<void>;
  generate: (params: { prompt: string; genre?: string; mood?: string; durationSeconds: number; instrumental: boolean }) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  tracks: [],
  generating: false,

  loadHistory: async () => {
    const data = await NovaApiClient.get<{ tracks: GeneratedMusicTrack[] }>("/api/music");
    set({ tracks: data.tracks });
  },

  generate: async (params) => {
    set({ generating: true });
    try {
      const data = await NovaApiClient.post<{ track: GeneratedMusicTrack }>("/api/music", params);
      set((s) => ({ tracks: [data.track, ...s.tracks] }));

      const poll = async () => {
        const fresh = await NovaApiClient.get<{ tracks: GeneratedMusicTrack[] }>("/api/music");
        const match = fresh.tracks.find((t) => t.id === data.track.id);
        set((s) => ({ tracks: s.tracks.map((t) => (t.id === data.track.id ? match || t : t)) }));
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

  deleteTrack: async (id) => {
    await NovaApiClient.delete(`/api/music/${id}`);
    set((s) => ({ tracks: s.tracks.filter((t) => t.id !== id) }));
  },
}));
