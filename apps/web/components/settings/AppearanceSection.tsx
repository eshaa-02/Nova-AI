"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useThemeStore, type ThemeMode } from "@/stores/theme.store";
import { useAuthStore } from "@/stores/auth.store";

const options: { mode: ThemeMode; icon: typeof Sun; label: string; description: string }[] = [
  { mode: "light", icon: Sun, label: "Light", description: "Warm ivory, bright and clean." },
  { mode: "dark", icon: Moon, label: "Dark", description: "Near-black with champagne gold accents." },
  { mode: "system", icon: Monitor, label: "System", description: "Match your device setting." },
];

export function AppearanceSection() {
  const { mode, setMode } = useThemeStore();
  const updateProfile = useAuthStore((s) => s.updateProfile);

  function handleSelect(next: ThemeMode) {
    setMode(next);
    updateProfile({ preferences: { theme: next } }).catch(() => {
      // Theme still applies locally even if the backend sync fails silently.
    });
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-text">Appearance</h2>
      <p className="mt-1 text-sm text-text-secondary">Choose how Nova AI looks on this device.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {options.map(({ mode: optionMode, icon: Icon, label, description }) => (
          <button
            key={optionMode}
            onClick={() => handleSelect(optionMode)}
            aria-pressed={mode === optionMode}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
              mode === optionMode ? "border-accent bg-accent-soft/30" : "border-border hover:border-accent/30"
            )}
          >
            <Icon size={18} className={mode === optionMode ? "text-accent" : "text-text-secondary"} />
            <span className="text-sm font-medium text-text">{label}</span>
            <span className="text-xs text-text-secondary">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
