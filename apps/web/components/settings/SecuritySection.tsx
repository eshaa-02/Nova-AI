"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth.store";
import { useToastStore } from "@/stores/toast.store";

export function SecuritySection() {
  const router = useRouter();
  const { logout, logoutAll } = useAuthStore();
  const [loading, setLoading] = useState<"one" | "all" | null>(null);

  async function handleLogout() {
    setLoading("one");
    await logout();
    router.push("/login");
  }

  async function handleLogoutAll() {
    setLoading("all");
    try {
      await logoutAll();
      useToastStore.getState().show("Signed out of all devices", "success");
      router.push("/login");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-text">Security</h2>
      <p className="mt-1 text-sm text-text-secondary">Manage where you're signed in.</p>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-md border border-border bg-surface p-4">
          <div>
            <p className="text-sm text-text">Sign out</p>
            <p className="text-xs text-text-secondary">End your session on this device.</p>
          </div>
          <Button variant="secondary" size="sm" loading={loading === "one"} onClick={handleLogout}>
            Sign out
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border bg-surface p-4">
          <div>
            <p className="text-sm text-text">Sign out everywhere</p>
            <p className="text-xs text-text-secondary">
              Revoke every active session, including this one.
            </p>
          </div>
          <Button variant="danger" size="sm" loading={loading === "all"} onClick={handleLogoutAll}>
            Sign out all
          </Button>
        </div>
      </div>
    </div>
  );
}
