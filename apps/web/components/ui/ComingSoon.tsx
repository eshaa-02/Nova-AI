import type { LucideIcon } from "lucide-react";
import { EmptyState } from "./EmptyState";

/**
 * Used for workspace pages whose backend capability isn't wired up yet
 * (e.g. image/voice/video/music generation, tools). Says so plainly
 * instead of a broken route or a faked result.
 */
export function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <header className="flex h-14 flex-none items-center border-b border-border px-4 sm:px-6">
        <h1 className="text-sm font-medium text-text">{title}</h1>
      </header>
      <EmptyState
        icon={icon}
        title={`${title} isn't configured yet`}
        description={description}
      />
    </div>
  );
}
