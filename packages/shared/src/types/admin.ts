export interface AdminStats {
  totals: {
    totalUsers: number;
    activeUsers: number;
    totalConversations: number;
    totalMessages: number;
    totalFiles: number;
  };
  system: {
    database: "connected" | "disconnected";
    aiProvider: { name: string; model: string };
    searchProvider: { name: string; configured: boolean };
    environment: string;
    uptimeSeconds: number;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isDisabled: boolean;
  emailVerified: boolean;
  createdAt: string;
}
