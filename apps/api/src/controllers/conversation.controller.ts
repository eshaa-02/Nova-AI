import type { Request, Response } from "express";
import { z } from "zod";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

function toDTO(conversation: any) {
  return {
    id: conversation._id.toString(),
    userId: conversation.userId.toString(),
    title: conversation.title,
    model: conversation.model,
    systemPrompt: conversation.systemPrompt,
    isPinned: conversation.isPinned,
    isArchived: conversation.isArchived,
    folder: conversation.folder,
    lastMessagePreview: conversation.lastMessagePreview,
    messageCount: conversation.messageCount,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

export const createConversationSchema = z.object({
  title: z.string().trim().max(200).optional(),
  model: z.string().optional(),
  systemPrompt: z.string().max(4000).optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  folder: z.string().max(80).optional(),
  model: z.string().optional(),
});

export const listConversations = asyncHandler(async (req: Request, res: Response) => {
  const { search, archived } = req.query as { search?: string; archived?: string };

  const filter: Record<string, unknown> = { userId: req.user!.id };
  if (archived === "true") filter.isArchived = true;
  else if (archived !== "all") filter.isArchived = { $ne: true };

  if (search) {
    filter.title = { $regex: search, $options: "i" };
  }

  const conversations = await Conversation.find(filter).sort({ isPinned: -1, updatedAt: -1 }).limit(200);

  sendSuccess(res, { conversations: conversations.map(toDTO) });
});

export const createConversation = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as z.infer<typeof createConversationSchema>;

  const conversation = await Conversation.create({
    userId: req.user!.id,
    title: body.title || "New chat",
    model: body.model || "nova-balanced",
    systemPrompt: body.systemPrompt,
  });

  sendSuccess(res, { conversation: toDTO(conversation) }, "Conversation created", 201);
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!conversation) throw ApiError.notFound("Conversation not found");
  sendSuccess(res, { conversation: toDTO(conversation) });
});

export const updateConversation = asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body as z.infer<typeof updateConversationSchema>;

  const conversation = await Conversation.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    { $set: updates },
    { new: true }
  );
  if (!conversation) throw ApiError.notFound("Conversation not found");

  sendSuccess(res, { conversation: toDTO(conversation) }, "Conversation updated");
});

export const deleteConversation = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await Conversation.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!conversation) throw ApiError.notFound("Conversation not found");

  await Message.deleteMany({ conversationId: conversation._id });
  sendSuccess(res, null, "Conversation deleted");
});
