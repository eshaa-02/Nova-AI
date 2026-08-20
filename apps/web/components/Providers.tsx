"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { Toaster } from "@/components/ui/Toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restoreSession();
    // Runs once on mount only — restoreSession is a stable Zustand action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
