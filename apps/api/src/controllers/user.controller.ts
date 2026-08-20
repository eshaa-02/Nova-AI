import type { Request, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { User } from "../models/User";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { FileAsset } from "../models/FileAsset";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { toPublicUser } from "./user.mapper";
import { getAvailableModels } from "../services/ai/models.catalog";
import { revokeAllUserSessions, REFRESH_COOKIE_NAME } from "../services/auth/token.service";
import { absoluteUploadPath } from "../middleware/upload";
import fs from "fs/promises";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.string().url().optional(),
  preferences: z
    .object({
      theme: z.enum(["dark", "light", "system"]).optional(),
      defaultModel: z.string().optional(),
    })
    .optional(),
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as z.infer<typeof updateProfileSchema>;

  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound("Account no longer exists.");

  if (updates.name) user.name = updates.name;
  if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl;
  if (updates.preferences) {
    user.preferences = { ...user.preferences, ...updates.preferences };
  }

  await user.save();
  sendSuccess(res, { user: toPublicUser(user) }, "Profile updated");
});

export const listModels = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, { models: getAvailableModels() });
});

export const deleteAccountSchema = z.object({
  confirm: z.literal(true, { errorMap: () => ({ message: "Confirmation is required." }) }),
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = new Types.ObjectId(req.user!.id);

  const conversations = await Conversation.find({ userId }).select("_id");
  const conversationIds = conversations.map((c) => c._id);

  await Message.deleteMany({ conversationId: { $in: conversationIds } });
  await Conversation.deleteMany({ userId });

  const files = await FileAsset.find({ userId });
  await Promise.all(
    files.map((f) => fs.unlink(absoluteUploadPath(f.storageName)).catch(() => {}))
  );
  await FileAsset.deleteMany({ userId });

  await revokeAllUserSessions(userId);
  await User.deleteOne({ _id: userId });

  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
  sendSuccess(res, null, "Account deleted");
});
