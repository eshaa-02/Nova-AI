import type { Request, Response } from "express";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { toMessageDTO } from "../sockets/chat.socket";

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
  const conversation = await Conversation.findOne({ _id: req.params.conversationId, userId: req.user!.id });
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
  sendSuccess(res, { messages: messages.map(toMessageDTO) });
});

export const toggleFavorite = asyncHandler(async (req: Request, res: Response) => {
  const message = await Message.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!message) throw ApiError.notFound("Message not found");

  message.isFavorite = !message.isFavorite;
  await message.save();

  sendSuccess(res, { message: toMessageDTO(message) }, message.isFavorite ? "Added to favorites" : "Removed from favorites");
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await Message.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!message) throw ApiError.notFound("Message not found");
  sendSuccess(res, null, "Message deleted");
});
