import type { PublicUser } from "@nova-ai/shared";
import type { IUser } from "../models/User";

export function toPublicUser(user: IUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    preferences: {
      theme: user.preferences?.theme ?? "system",
      defaultModel: user.preferences?.defaultModel,
    },
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
