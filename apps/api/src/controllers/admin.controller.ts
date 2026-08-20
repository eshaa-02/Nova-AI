import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { User } from "../models/User";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { FileAsset } from "../models/FileAsset";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { env } from "../config/env";
import { getAIProvider } from "../services/ai/AIProviderFactory";
import { getSearchProvider } from "../services/search/SearchProviderFactory";
import { revokeAllUserSessions } from "../services/auth/token.service";
import { absoluteUploadPath } from "../middleware/upload";
import fs from "fs/promises";

function toAdminUserDTO(user: any) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isDisabled: user.isDisabled,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, activeUsers, totalConversations, totalMessages, totalFiles] = await Promise.all([
    User.countDocuments(),
    Conversation.distinct("userId", { updatedAt: { $gte: since30d } }).then((ids) => ids.length),
    Conversation.countDocuments(),
    Message.countDocuments(),
    FileAsset.countDocuments(),
  ]);

  const aiProvider = getAIProvider();
  const searchProvider = getSearchProvider();

  sendSuccess(res, {
    totals: { totalUsers, activeUsers, totalConversations, totalMessages, totalFiles },
    system: {
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      aiProvider: { name: aiProvider.name, model: aiProvider.model },
      searchProvider: { name: searchProvider.name, configured: searchProvider.configured },
      environment: env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
    },
  });
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { search, page = "1" } = req.query as { search?: string; page?: string };
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 20;

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, {
    users: users.map(toAdminUserDTO),
    page: pageNum,
    pageSize,
    total,
    hasMore: pageNum * pageSize < total,
  });
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  isDisabled: z.boolean().optional(),
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as z.infer<typeof updateUserRoleSchema>;

  if (req.params.id === req.user!.id && (updates.role === "user" || updates.isDisabled === true)) {
    throw ApiError.badRequest("You can't demote or disable your own account.");
  }

  const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
  if (!user) throw ApiError.notFound("User not found");

  if (updates.isDisabled === true) {
    await revokeAllUserSessions(user._id);
  }

  sendSuccess(res, { user: toAdminUserDTO(user) }, "User updated");
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  if (req.params.id === req.user!.id) {
    throw ApiError.badRequest("You can't delete your own account from here.");
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  const conversations = await Conversation.find({ userId: user._id }).select("_id");
  await Message.deleteMany({ conversationId: { $in: conversations.map((c) => c._id) } });
  await Conversation.deleteMany({ userId: user._id });

  const files = await FileAsset.find({ userId: user._id });
  await Promise.all(files.map((f) => fs.unlink(absoluteUploadPath(f.storageName)).catch(() => {})));
  await FileAsset.deleteMany({ userId: user._id });

  await revokeAllUserSessions(user._id);

  sendSuccess(res, null, "User deleted");
});
