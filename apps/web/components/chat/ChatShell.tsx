"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Sidebar } from "./Sidebar";
import { useChatStore } from "@/stores/chat.store";

export function ChatShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bindSocketListeners = useChatStore((s) => s.bindSocketListeners);

  useEffect(() => {
    const unbind = bindSocketListeners();
    return unbind;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setMobileOpen(false)} />
            <div className="absolute inset-y-0 left-0 animate-slide-up">
              <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 flex-none items-center border-b border-border px-3 md:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-md text-text"
            >
              <Menu size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
