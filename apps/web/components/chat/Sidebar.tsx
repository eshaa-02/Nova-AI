"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  PenSquare,
  Search,
  Pin,
  MoreHorizontal,
  Pencil,
  Archive,
  Trash2,
  Settings,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils/cn";
import { useChatStore } from "@/stores/chat.store";
import { useAuthStore } from "@/stores/auth.store";
import type { Conversation } from "@nova-ai/shared";

function groupConversations(conversations: Conversation[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 86400000);

  const groups: Record<string, Conversation[]> = {
    Pinned: [],
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  };

  for (const c of conversations) {
    const updated = new Date(c.updatedAt);
    if (c.isPinned) groups.Pinned.push(c);
    else if (updated >= startOfToday) groups.Today.push(c);
    else if (updated >= startOfYesterday) groups.Yesterday.push(c);
    else if (updated >= sevenDaysAgo) groups["Previous 7 days"].push(c);
    else groups.Older.push(c);
  }

  return groups;
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const {
    conversations,
    loadConversations,
    createConversation,
    renameConversation,
    togglePin,
    toggleArchive,
    deleteConversation,
  } = useChatStore();

  const [search, setSearch] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, search]);

  const groups = useMemo(() => groupConversations(filtered), [filtered]);

  async function handleNewChat() {
    const conversation = await createConversation();
    router.push(`/chat/${conversation.id}`);
  }

  function startRename(c: Conversation) {
    setMenuOpenId(null);
    setRenamingId(c.id);
    setRenameValue(c.title);
  }

  async function commitRename(id: string) {
    if (renameValue.trim()) {
      await renameConversation(id, renameValue.trim());
    }
    setRenamingId(null);
  }

  if (collapsed) {
    return (
      <div className="flex h-full w-16 flex-col items-center border-r border-border bg-background-secondary py-4">
        <button
          onClick={onToggle}
          aria-label="Expand sidebar"
          className="flex h-10 w-10 items-center justify-center rounded-md text-text-secondary hover:bg-surface hover:text-text"
        >
          <PanelLeftOpen size={18} />
        </button>
        <button
          onClick={handleNewChat}
          aria-label="New chat"
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-md bg-accent text-background hover:bg-accent-hover"
        >
          <PenSquare size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-72 flex-none flex-col border-r border-border bg-background-secondary">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <Logo />
        <button
          onClick={onToggle}
          aria-label="Collapse sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-text"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      <div className="px-3 pt-2">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text transition-colors hover:bg-surface-elevated"
        >
          <PenSquare size={15} className="text-accent" />
          New chat
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Search size={14} className="flex-none text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
            aria-label="Search conversations"
            className="w-full bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
          />
        </div>
      </div>

      <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-3" aria-label="Conversation history">
        {conversations.length === 0 ? (
          <p className="mt-8 px-2 text-center text-sm text-muted">No conversations yet.</p>
        ) : (
          Object.entries(groups).map(([label, items]) =>
            items.length === 0 ? null : (
              <div key={label} className="mb-4">
                <h3 className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                  {label}
                </h3>
                <ul className="flex flex-col gap-0.5">
                  {items.map((c) => {
                    const active = pathname === `/chat/${c.id}`;
                    return (
                      <li key={c.id} className="group relative">
                        {renamingId === c.id ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => commitRename(c.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitRename(c.id);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            className="w-full rounded-md border border-accent bg-surface px-2 py-2 text-sm text-text focus:outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => router.push(`/chat/${c.id}`)}
                            className={cn(
                              "flex w-full items-center gap-1.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
                              active ? "bg-surface-elevated text-text" : "text-text-secondary hover:bg-surface"
                            )}
                          >
                            {c.isPinned && <Pin size={11} className="flex-none text-accent" />}
                            <span className="flex-1 truncate">{c.title}</span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === c.id ? null : c.id);
                              }}
                              className="flex-none rounded p-1 opacity-0 hover:bg-border group-hover:opacity-100"
                            >
                              <MoreHorizontal size={14} />
                            </span>
                          </button>
                        )}

                        {menuOpenId === c.id && (
                          <div className="absolute right-1 top-9 z-10 w-40 overflow-hidden rounded-md border border-border bg-surface-elevated shadow-nova-md animate-fade-in">
                            <MenuItem icon={Pencil} label="Rename" onClick={() => startRename(c)} />
                            <MenuItem
                              icon={Pin}
                              label={c.isPinned ? "Unpin" : "Pin"}
                              onClick={() => {
                                togglePin(c.id, !c.isPinned);
                                setMenuOpenId(null);
                              }}
                            />
                            <MenuItem
                              icon={Archive}
                              label="Archive"
                              onClick={() => {
                                toggleArchive(c.id, true);
                                setMenuOpenId(null);
                              }}
                            />
                            <MenuItem
                              icon={Trash2}
                              label="Delete"
                              danger
                              onClick={() => {
                                deleteConversation(c.id);
                                setMenuOpenId(null);
                                if (active) router.push("/chat");
                              }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
          )
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between rounded-md px-2 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-soft text-sm font-medium text-accent">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-text">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/settings")}
            aria-label="Settings"
            className="flex-none rounded-md p-1.5 text-muted hover:bg-surface hover:text-text"
          >
            <Settings size={16} />
          </button>
        </div>
        {user?.role === "admin" && (
          <button
            onClick={() => router.push("/admin")}
            className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm text-text-secondary hover:bg-surface hover:text-text"
          >
            <ShieldCheck size={15} className="text-accent" />
            Admin dashboard
          </button>
        )}
        <div className="mt-2 flex justify-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface",
        danger ? "text-error" : "text-text"
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
