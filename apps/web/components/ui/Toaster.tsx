"use client";

import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/stores/toast.store";
import { cn } from "@/lib/utils/cn";

const icons = { default: Info, success: CheckCircle2, error: XCircle };

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.variant];
        return (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "flex items-start gap-2.5 rounded-md border border-border bg-surface-elevated px-4 py-3 shadow-nova-md animate-slide-up"
            )}
          >
            <Icon
              size={16}
              className={cn(
                "mt-0.5 flex-none",
                toast.variant === "success" && "text-success",
                toast.variant === "error" && "text-error",
                toast.variant === "default" && "text-accent"
              )}
            />
            <p className="flex-1 text-sm text-text">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="flex-none text-muted hover:text-text"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
