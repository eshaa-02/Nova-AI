import { Mic, MicOff, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type VoiceSessionState = "idle" | "listening" | "processing" | "speaking" | "error";

export function VoiceOrb({
  state,
  muted,
  onClick,
}: {
  state: VoiceSessionState;
  muted: boolean;
  onClick: () => void;
}) {
  const Icon = state === "processing" ? Loader2 : state === "speaking" ? Volume2 : muted ? MicOff : Mic;

  return (
    <button
      onClick={onClick}
      disabled={state === "processing" || state === "speaking"}
      aria-label={state === "listening" ? "Stop listening" : "Start listening"}
      className={cn(
        "flex h-24 w-24 items-center justify-center rounded-full border transition-all duration-normal",
        state === "listening" && "border-accent bg-accent-soft shadow-nova-lg scale-105",
        state === "processing" && "border-border bg-surface",
        state === "speaking" && "border-accent bg-accent-soft",
        state === "idle" && "border-border bg-surface hover:border-accent/40",
        state === "error" && "border-error/40 bg-error/5"
      )}
    >
      <Icon
        size={28}
        className={cn(
          state === "processing" && "animate-spin",
          (state === "listening" || state === "speaking") ? "text-accent" : "text-text-secondary"
        )}
      />
    </button>
  );
}
