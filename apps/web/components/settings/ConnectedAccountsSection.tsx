import { Link2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function ConnectedAccountsSection() {
  return (
    <div>
      <h2 className="font-display text-2xl text-text">Connected Accounts</h2>
      <p className="mt-1 text-sm text-text-secondary">Sign in with Google or GitHub.</p>

      <div className="mt-6">
        <EmptyState
          icon={Link2}
          title="No providers configured"
          description="Google and GitHub sign-in aren't configured on this deployment yet. They'll appear here once OAuth credentials are set on the backend."
        />
      </div>
    </div>
  );
}
