"use client";

import { create } from "zustand";
import type { GeneratedImage, ImageAspectRatio } from "@nova-ai/shared";
import { NovaApiClient, NovaApiError } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

interface ImagesState {
  images: GeneratedImage[];
  generating: boolean;
  error: string | null;
  loadHistory: () => Promise<void>;
  generate: (params: { prompt: string; style?: string; aspectRatio: ImageAspectRatio; count: number }) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
}

const TERMINAL_STATUSES = new Set(["ready", "failed"]);

export const useImagesStore = create<ImagesState>((set, get) => ({
  images: [],
  generating: false,
  error: null,

  loadHistory: async () => {
    const data = await NovaApiClient.get<{ images: GeneratedImage[] }>("/api/images");
    set({ images: data.images });
  },

  generate: async ({ prompt, style, aspectRatio, count }) => {
    set({ generating: true, error: null });
    try {
      const data = await NovaApiClient.post<{ images: GeneratedImage[] }>("/api/images", {
        prompt,
        style,
        aspectRatio,
        count,
      });
      const groupId = data.images[0]?.groupId;
      set((s) => ({ images: [...data.images, ...s.images] }));

      // Poll until every image in this generation batch reaches a terminal state.
      const poll = async () => {
        const result = await NovaApiClient.get<{ images: GeneratedImage[] }>(
          `/api/images?groupId=${groupId}`
        );
        set((s) => ({
          images: s.images.map((img) => result.images.find((r) => r.id === img.id) || img),
        }));
        const allDone = result.images.every((img) => TERMINAL_STATUSES.has(img.status));
        if (!allDone) {
          setTimeout(poll, 1500);
        } else {
          set({ generating: false });
        }
      };
      setTimeout(poll, 1500);
    } catch (err) {
      const message = err instanceof NovaApiError ? err.message : "Couldn't start generation. Please try again.";
      set({ generating: false, error: message });
      useToastStore.getState().show(message, "error");
      throw err;
    }
  },

  deleteImage: async (id) => {
    await NovaApiClient.delete(`/api/images/${id}`);
    set((s) => ({ images: s.images.filter((i) => i.id !== id) }));
  },
}));
