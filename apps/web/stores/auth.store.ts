"use client";

import { create } from "zustand";
import type { PublicUser } from "@nova-ai/shared";
import { NovaApiClient, NovaApiError } from "@/lib/api/client";

interface AuthState {
  user: PublicUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatarUrl?: string; preferences?: Partial<PublicUser["preferences"]> }) => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ status: "loading", error: null });
    try {
      const data = await NovaApiClient.post<{ user: PublicUser; accessToken: string }>("/api/auth/login", {
        email,
        password,
      });
      NovaApiClient.setAccessToken(data.accessToken);
      set({ user: data.user, status: "authenticated" });
    } catch (err) {
      set({ status: "unauthenticated", error: errorMessage(err) });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ status: "loading", error: null });
    try {
      const data = await NovaApiClient.post<{ user: PublicUser; accessToken: string }>("/api/auth/register", {
        name,
        email,
        password,
      });
      NovaApiClient.setAccessToken(data.accessToken);
      set({ user: data.user, status: "authenticated" });
    } catch (err) {
      set({ status: "unauthenticated", error: errorMessage(err) });
      throw err;
    }
  },

  logout: async () => {
    try {
      await NovaApiClient.post("/api/auth/logout");
    } finally {
      NovaApiClient.setAccessToken(null);
      set({ user: null, status: "unauthenticated" });
    }
  },

  logoutAll: async () => {
    try {
      await NovaApiClient.post("/api/auth/logout-all");
    } finally {
      NovaApiClient.setAccessToken(null);
      set({ user: null, status: "unauthenticated" });
    }
  },

  updateProfile: async (updates) => {
    const data = await NovaApiClient.patch<{ user: PublicUser }>("/api/users/me", updates);
    set({ user: data.user });
  },

  restoreSession: async () => {
    set({ status: "loading" });
    const token = await NovaApiClient.restoreSession();
    if (!token) {
      set({ status: "unauthenticated", user: null });
      return;
    }
    try {
      const data = await NovaApiClient.get<{ user: PublicUser }>("/api/auth/me");
      set({ user: data.user, status: "authenticated" });
    } catch {
      set({ status: "unauthenticated", user: null });
    }
  },
}));

function errorMessage(err: unknown): string {
  if (err instanceof NovaApiError) return err.message;
  return "Something went wrong. Please try again.";
}
