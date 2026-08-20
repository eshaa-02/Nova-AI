export type UserRole = "user" | "admin";

export interface UserPreferences {
  theme: "dark" | "light" | "system";
  defaultModel?: string;
}

/** Public-safe user shape — never includes password or token hashes. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  preferences: UserPreferences;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokensResponse {
  user: PublicUser;
  accessToken: string;
  /** Refresh token is set as an HTTP-only cookie; not returned in JSON bodies. */
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
