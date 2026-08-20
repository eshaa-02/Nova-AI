import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env";
import { RefreshToken } from "../../models/RefreshToken";
import { ApiError } from "../../utils/ApiError";
import type { Types } from "mongoose";

export interface AccessTokenPayload {
  sub: string; // user id
  role: "user" | "admin";
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw ApiError.unauthorized("Your session has expired. Please sign in again.");
  }
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function msFromDuration(duration: string): number {
  // supports formats like "30d", "15m", "12h"
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * multipliers[unit];
}

/** Issues a new refresh token, stores its hash, and returns the raw token to set as a cookie. */
export async function issueRefreshToken(userId: Types.ObjectId, userAgent?: string): Promise<string> {
  const raw = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + msFromDuration(env.JWT_REFRESH_EXPIRES_IN));

  await RefreshToken.create({
    userId,
    tokenHash: hashToken(raw),
    expiresAt,
    userAgent,
  });

  return raw;
}

/**
 * Verifies a raw refresh token cookie value, rotates it (revokes the old
 * one, issues a new one), and returns { userId, newRawToken }.
 * Throws if the token is unknown, expired, or already-revoked (reuse —
 * which invalidates the whole token family for safety).
 */
export async function rotateRefreshToken(
  rawToken: string,
  userAgent?: string
): Promise<{ userId: Types.ObjectId; newRawToken: string }> {
  const tokenHash = hashToken(rawToken);
  const existing = await RefreshToken.findOne({ tokenHash });

  if (!existing) {
    throw ApiError.unauthorized("Session not recognized. Please sign in again.");
  }

  if (existing.revokedAt || existing.expiresAt < new Date()) {
    // Reuse of a rotated-out (or expired) token is a strong signal of theft —
    // revoke every active session for this user as a precaution.
    await RefreshToken.updateMany(
      { userId: existing.userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
    throw ApiError.unauthorized("Session expired or already used. Please sign in again.");
  }

  const newRawToken = crypto.randomBytes(48).toString("hex");
  const newHash = hashToken(newRawToken);

  existing.revokedAt = new Date();
  existing.replacedByHash = newHash;
  await existing.save();

  await RefreshToken.create({
    userId: existing.userId,
    tokenHash: newHash,
    expiresAt: new Date(Date.now() + msFromDuration(env.JWT_REFRESH_EXPIRES_IN)),
    userAgent,
  });

  return { userId: existing.userId, newRawToken };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllUserSessions(userId: Types.ObjectId): Promise<void> {
  await RefreshToken.updateMany(
    { userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  );
}

export const REFRESH_COOKIE_NAME = "nova_refresh_token";
export const REFRESH_COOKIE_MAX_AGE_MS = msFromDuration(env.JWT_REFRESH_EXPIRES_IN);
