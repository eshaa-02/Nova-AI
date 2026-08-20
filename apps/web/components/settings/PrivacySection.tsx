"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NovaApiClient, NovaApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";
import { useToastStore } from "@/stores/toast.store";

const notes = [
  "Every conversation, message, and file is scoped to your account — other users can never query or view them.",
  "Uploaded files are stored under a randomly generated name, never your original filename, and are only served back to the account that uploaded them.",
  "Refresh tokens are stored hashed, never in plain text, and are rotated on every use.",
];

export function PrivacySection() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await NovaApiClient.delete("/api/users/me", { confirm: true });
      await logout();
      router.push("/");
    } catch (err) {
      const message = err instanceof NovaApiError ? err.message : "Couldn't delete your account. Please try again.";
      useToastStore.getState().show(message, "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-text">Privacy & Data</h2>
      <p className="mt-1 text-sm text-text-secondary">How your data is handled.</p>

      <div className="mt-6 flex flex-col gap-2.5">
        {notes.map((note) => (
          <div key={note} className="flex items-start gap-2.5 rounded-md border border-border bg-surface p-3.5">
            <ShieldCheck size={15} className="mt-0.5 flex-none text-success" />
            <p className="text-sm text-text-secondary">{note}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-md border border-error/30 bg-error/5 p-4">
        <p className="text-sm font-medium text-error">Delete account</p>
        <p className="mt-1 text-xs text-text-secondary">
          Permanently deletes your account, conversations, messages, and uploaded files. This cannot be undone.
        </p>
        {!confirming ? (
          <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirming(true)}>
            Delete my account
          </Button>
        ) : (
          <div className="mt-3 flex gap-2">
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
              Confirm permanent deletion
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
