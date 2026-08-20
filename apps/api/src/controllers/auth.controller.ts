import type { Request, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { isProduction } from "../config/env";
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserSessions,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_MAX_AGE_MS,
} from "../services/auth/token.service";
import { toPublicUser } from "./user.mapper";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  path: "/api/auth",
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as z.infer<typeof registerSchema>;

  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists.");
  }

  const user = await User.create({ name, email, password });
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user._id, req.headers["user-agent"] as string);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
  sendSuccess(res, { user: toPublicUser(user), accessToken }, "Account created", 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized("Incorrect email or password.");
  }
  if (user.isDisabled) {
    throw ApiError.forbidden("This account has been disabled. Contact support for help.");
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user._id, req.headers["user-agent"] as string);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);
  sendSuccess(res, { user: toPublicUser(user), accessToken }, "Welcome back");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawToken) {
    throw ApiError.unauthorized("No active session found.");
  }

  const { userId, newRawToken } = await rotateRefreshToken(
    rawToken,
    req.headers["user-agent"] as string
  );

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.unauthorized("Account no longer exists.");
  }
  if (user.isDisabled) {
    throw ApiError.forbidden("This account has been disabled. Contact support for help.");
  }

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  res.cookie(REFRESH_COOKIE_NAME, newRawToken, cookieOptions);
  sendSuccess(res, { user: toPublicUser(user), accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (rawToken) {
    await revokeRefreshToken(rawToken);
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  sendSuccess(res, null, "Signed out");
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await revokeAllUserSessions(new Types.ObjectId(req.user!.id));
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  sendSuccess(res, null, "Signed out of all devices");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound("Account no longer exists.");
  sendSuccess(res, { user: toPublicUser(user) });
});
