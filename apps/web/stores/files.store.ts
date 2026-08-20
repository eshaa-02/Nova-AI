"use client";

import { create } from "zustand";
import type { FileAsset, FileActionKind } from "@nova-ai/shared";
import { NovaApiClient, NovaApiError } from "@/lib/api/client";
import { useToastStore } from "@/stores/toast.store";

interface FilesState {
  files: FileAsset[];
  uploading: boolean;
  loadFiles: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  runAction: (id: string, action: FileActionKind | "ask", question?: string) => Promise<string>;
}

export const useFilesStore = create<FilesState>((set, get) => ({
  files: [],
  uploading: false,

  loadFiles: async () => {
    const data = await NovaApiClient.get<{ files: FileAsset[] }>("/api/files");
    set({ files: data.files });
  },

  uploadFile: async (file) => {
    set({ uploading: true });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await NovaApiClient.postForm<{ file: FileAsset }>("/api/files", formData);
      set((s) => ({ files: [data.file, ...s.files] }));
      useToastStore.getState().show("File uploaded", "success");
    } catch (err) {
      const message = err instanceof NovaApiError ? err.message : "Upload failed. Please try again.";
      useToastStore.getState().show(message, "error");
      throw err;
    } finally {
      set({ uploading: false });
    }
  },

  deleteFile: async (id) => {
    await NovaApiClient.delete(`/api/files/${id}`);
    set((s) => ({ files: s.files.filter((f) => f.id !== id) }));
    useToastStore.getState().show("File deleted", "success");
  },

  runAction: async (id, action, question) => {
    try {
      const data = await NovaApiClient.post<{ result: string }>(`/api/files/${id}/actions`, {
        action,
        question,
      });
      return data.result;
    } catch (err) {
      const message = err instanceof NovaApiError ? err.message : "That action failed. Please try again.";
      useToastStore.getState().show(message, "error");
      throw err;
    }
  },
}));
