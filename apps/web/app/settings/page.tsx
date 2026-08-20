"use client";

import { useState } from "react";
import { User, Palette, Cpu, ShieldCheck, Lock, Link2 } from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { cn } from "@/lib/utils/cn";
import { AccountSection } from "@/components/settings/AccountSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { AISection } from "@/components/settings/AISection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { PrivacySection } from "@/components/settings/PrivacySection";
import { ConnectedAccountsSection } from "@/components/settings/ConnectedAccountsSection";

const tabs = [
  { key: "account", label: "Account", icon: User, Component: AccountSection },
  { key: "appearance", label: "Appearance", icon: Palette, Component: AppearanceSection },
  { key: "ai", label: "AI", icon: Cpu, Component: AISection },
  { key: "security", label: "Security", icon: ShieldCheck, Component: SecuritySection },
  { key: "privacy", label: "Privacy & Data", icon: Lock, Component: PrivacySection },
  { key: "connected", label: "Connected Accounts", icon: Link2, Component: ConnectedAccountsSection },
] as const;

export default function SettingsPage() {
  const [active, setActive] = useState<(typeof tabs)[number]["key"]>("account");
  const ActiveComponent = tabs.find((t) => t.key === active)!.Component;

  return (
    <ChatShell>
      <div className="flex flex-1 overflow-hidden">
        <nav className="w-56 flex-none overflow-y-auto border-r border-border p-3" aria-label="Settings sections">
          <h1 className="px-2 py-2 text-sm font-medium text-text">Settings</h1>
          <ul className="mt-1 flex flex-col gap-0.5">
            {tabs.map(({ key, label, icon: Icon }) => (
              <li key={key}>
                <button
                  onClick={() => setActive(key)}
                  aria-current={active === key}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                    active === key ? "bg-surface-elevated text-text" : "text-text-secondary hover:bg-surface"
                  )}
                >
                  <Icon size={15} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 overflow-y-auto px-6 py-8 sm:px-10">
          <div className="mx-auto max-w-xl">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </ChatShell>
  );
}
