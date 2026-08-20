"use client";

import { useEffect, useState } from "react";
import { Users, MessageSquare, MessagesSquare, FileText, Activity, Loader2 } from "lucide-react";
import type { AdminStats } from "@nova-ai/shared";
import { ChatShell } from "@/components/chat/ChatShell";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { StatCard } from "@/components/admin/StatCard";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { NovaApiClient } from "@/lib/api/client";

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    NovaApiClient.get<AdminStats>("/api/admin/stats").then(setStats);
  }, []);

  return (
    <AdminGuard>
      <ChatShell>
        <div className="flex flex-1 flex-col overflow-y-auto">
          <header className="flex h-14 flex-none items-center border-b border-border px-4 sm:px-6">
            <h1 className="text-sm font-medium text-text">Admin</h1>
          </header>

          <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
            {!stats ? (
              <div className="flex justify-center py-16">
                <Loader2 size={22} className="animate-spin text-accent" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <StatCard icon={Users} label="Total users" value={stats.totals.totalUsers} />
                  <StatCard icon={Activity} label="Active (30d)" value={stats.totals.activeUsers} />
                  <StatCard icon={MessagesSquare} label="Conversations" value={stats.totals.totalConversations} />
                  <StatCard icon={MessageSquare} label="Messages" value={stats.totals.totalMessages} />
                  <StatCard icon={FileText} label="Files uploaded" value={stats.totals.totalFiles} />
                </div>

                <div className="mt-6 rounded-lg border border-border bg-surface p-5">
                  <h2 className="text-xs font-medium uppercase tracking-wide text-muted">System status</h2>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <StatusRow label="Database" value={stats.system.database} ok={stats.system.database === "connected"} />
                    <StatusRow
                      label="AI provider"
                      value={`${stats.system.aiProvider.name} (${stats.system.aiProvider.model})`}
                      ok={stats.system.aiProvider.name !== "mock"}
                    />
                    <StatusRow
                      label="Search provider"
                      value={stats.system.searchProvider.configured ? stats.system.searchProvider.name : "not configured"}
                      ok={stats.system.searchProvider.configured}
                    />
                    <StatusRow label="Environment" value={stats.system.environment} ok />
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="mb-3 text-sm font-medium text-text">Users</h2>
                  <UserManagementTable />
                </div>
              </>
            )}
          </div>
        </div>
      </ChatShell>
    </AdminGuard>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-background px-3.5 py-2.5">
      <span className="text-text-secondary">{label}</span>
      <span className={ok ? "text-success" : "text-warning"}>{value}</span>
    </div>
  );
}
