"use client";

import { create } from "zustand";
import type { PhotoEditOperation } from "@nova-ai/shared";
import { NovaApiClient, NovaApiError } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

interface PhotoEditorState {
  history: string[];
  index: number;
  processing: boolean;
  error: string | null;

  loadImage: (file: File) => void;
  pushState: (url: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  runAIEdit: (operation: PhotoEditOperation, prompt?: string) => Promise<void>;
  applyCanvasEdit: (draw: (img: HTMLImageElement, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void) => Promise<void>;
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export const usePhotoEditorStore = create<PhotoEditorState>((set, get) => ({
  history: [],
  index: -1,
  processing: false,
  error: null,

  loadImage: (file) => {
    const url = URL.createObjectURL(file);
    set({ history: [url], index: 0, error: null });
  },

  pushState: (url) => {
    const { history, index } = get();
    const truncated = history.slice(0, index + 1);
    set({ history: [...truncated, url], index: truncated.length });
  },

  undo: () => set((s) => ({ index: Math.max(0, s.index - 1) })),
  redo: () => set((s) => ({ index: Math.min(s.history.length - 1, s.index + 1) })),
  reset: () => set({ index: 0 }),

  runAIEdit: async (operation, prompt) => {
    const { history, index, pushState } = get();
    const currentUrl = history[index];
    if (!currentUrl) return;

    set({ processing: true, error: null });
    try {
      const blob = await fetch(currentUrl).then((r) => r.blob());
      const formData = new FormData();
      formData.append("image", blob, "image.png");
      formData.append("operation", operation);
      if (prompt) formData.append("prompt", prompt);

      const data = await NovaApiClient.postForm<{ edit: { id: string; status: string } }>(
        "/api/photo-edits",
        formData
      );

      if (data.edit.status !== "ready") {
        throw new Error("The edit failed. Please try again.");
      }

      const resultUrl = await NovaApiClient.getBlobUrl(`/api/photo-edits/${data.edit.id}/file`);
      pushState(resultUrl);
    } catch (err) {
      const message = err instanceof NovaApiError ? err.message : (err as Error).message || "Edit failed.";
      set({ error: message });
      useToastStore.getState().show(message, "error");
    } finally {
      set({ processing: false });
    }
  },

  applyCanvasEdit: async (draw) => {
    const { history, index, pushState } = get();
    const currentUrl = history[index];
    if (!currentUrl) return;

    const img = await loadImageElement(currentUrl);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    draw(img, ctx, canvas);

    const blobUrl = await new Promise<string>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(URL.createObjectURL(blob));
      }, "image/png");
    });

    pushState(blobUrl);
  },
}));
