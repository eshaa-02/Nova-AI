"use client";

import { create } from "zustand";

export type ThemeMode = "dark" | "light" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const isDark =
    mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("light", !isDark);
}

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("nova-theme") as ThemeMode) || "system";
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: getInitialMode(),
  setMode: (mode) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nova-theme", mode);
    }
    applyTheme(mode);
    set({ mode });
  },
}));

if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (useThemeStore.getState().mode === "system") {
      applyTheme("system");
    }
  });
}
