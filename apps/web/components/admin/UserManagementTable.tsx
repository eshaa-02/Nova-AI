"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, ShieldOff, Trash2, Loader2 } from "lucide-react";
import type { AdminUser } from "@nova-ai/shared";
import { NovaApiClient, NovaApiError } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth.store";
import { useToastStore } from "@/stores/toast.store";

export function UserManagementTable() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function load(query = "") {
    setLoading(true);
    try {
      const data = await NovaApiClient.get<{ users: AdminUser[] }>(
        `/api/admin/users${query ? `?search=${encodeURIComponent(query)}` : ""}`
      );
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpdate(id: string, updates: Partial<Pick<AdminUser, "role" | "isDisabled">>) {
    setPendingId(id);
    try {
      const data = await NovaApiClient.patch<{ user: AdminUser }>(`/api/admin/users/${id}`, updates);
      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
    } catch (err) {
      const message = err instanceof NovaApiError ? err.message : "Couldn't update this user.";
      useToastStore.getState().show(message, "error");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    try {
      await NovaApiClient.delete(`/api/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      useToastStore.getState().show("User deleted", "success");
    } catch (err) {
      const message = err instanceof NovaApiError ? err.message : "Couldn't delete this user.";
      useToastStore.getState().show(message, "error");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
        <Search size={14} className="flex-none text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(search)}
          placeholder="Search by name or email..."
          className="w-full bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  <Loader2 size={16} className="mx-auto animate-spin" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const busy = pendingId === u.id;
                return (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-text">{u.name}</td>
                    <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={u.isDisabled ? "text-error" : "text-success"}>
                        {u.isDisabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          disabled={isSelf || busy}
                          onClick={() => handleUpdate(u.id, { role: u.role === "admin" ? "user" : "admin" })}
                          title={u.role === "admin" ? "Demote to user" : "Promote to admin"}
                          className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-text disabled:opacity-30"
                        >
                          <ShieldCheck size={14} />
                        </button>
                        <button
                          disabled={isSelf || busy}
                          onClick={() => handleUpdate(u.id, { isDisabled: !u.isDisabled })}
                          title={u.isDisabled ? "Enable account" : "Disable account"}
                          className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-text disabled:opacity-30"
                        >
                          <ShieldOff size={14} />
                        </button>
                        <button
                          disabled={isSelf || busy}
                          onClick={() => handleDelete(u.id)}
                          title="Delete user"
                          className="rounded-md p-1.5 text-muted hover:bg-error/10 hover:text-error disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
