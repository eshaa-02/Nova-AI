import { cn } from "@/lib/utils/cn";

/**
 * Original Nova AI brand mark: a small radiant mark (an asterisk-like
 * spark, not a robot/circuit icon) paired with a serif wordmark.
 */
export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2 L14.2 9.8 L22 12 L14.2 14.2 L12 22 L9.8 14.2 L2 12 L9.8 9.8 Z"
          fill="rgb(var(--color-accent))"
        />
      </svg>
      {!markOnly && (
        <span className="font-display text-[1.15rem] tracking-tight text-text">
          Nova <span className="text-accent">AI</span>
        </span>
      )}
    </div>
  );
}
