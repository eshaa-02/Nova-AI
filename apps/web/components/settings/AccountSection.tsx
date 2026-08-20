"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth.store";
import { useToastStore } from "@/stores/toast.store";

export function AccountSection() {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, avatarUrl: avatarUrl || undefined });
      useToastStore.getState().show("Profile updated", "success");
    } catch {
      useToastStore.getState().show("Couldn't save your changes. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-text">Account</h2>
      <p className="mt-1 text-sm text-text-secondary">Update your name and profile picture.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-full bg-accent-soft text-xl font-medium text-accent">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              name?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <Input
            label="Avatar URL"
            placeholder="https://..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="flex-1"
          />
        </div>

        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email" value={user?.email || ""} disabled />

        <div>
          <Button type="submit" loading={saving} size="sm">
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
