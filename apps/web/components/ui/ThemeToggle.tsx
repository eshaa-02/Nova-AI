"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useThemeStore, type ThemeMode } from "@/stores/theme.store";
import { cn } from "@/lib/utils/cn";

const options: { mode: ThemeMode; icon: typeof Sun; label: string }[] = [
  { mode: "light", icon: Sun, label: "Light theme" },
  { mode: "dark", icon: Moon, label: "Dark theme" },
  { mode: "system", icon: Monitor, label: "System theme" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useThemeStore();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-surface p-0.5",
        className
      )}
      role="group"
      aria-label="Theme"
    >
      {options.map(({ mode: optionMode, icon: Icon, label }) => (
        <button
          key={optionMode}
          type="button"
          aria-label={label}
          aria-pressed={mode === optionMode}
          onClick={() => setMode(optionMode)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-[7px] transition-colors duration-fast",
            mode === optionMode
              ? "bg-accent-soft text-accent"
              : "text-muted hover:text-text-secondary"
          )}
        >
          <Icon size={15} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}
