import type { Request, Response } from "express";
import fs from "fs/promises";
import { z } from "zod";
import { FileAsset } from "../models/FileAsset";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { absoluteUploadPath } from "../middleware/upload";
import { extractText, trimForContext } from "../services/files/textExtraction.service";
import { getAIProvider } from "../services/ai/AIProviderFactory";

function toDTO(file: any) {
  return {
    id: file._id.toString(),
    userId: file.userId.toString(),
    fileName: file.fileName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    status: file.status,
    hasExtractedText: Boolean(file.extractedText),
    errorMessage: file.errorMessage,
    createdAt: file.createdAt.toISOString(),
  };
}

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file was uploaded.");
  }

  const file = await FileAsset.create({
    userId: req.user!.id,
    fileName: req.file.originalname,
    storageName: req.file.filename,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    status: "processing",
  });

  try {
    const text = await extractText(absoluteUploadPath(file.storageName), file.mimeType);
    file.extractedText = text ? trimForContext(text) : undefined;
    file.status = "ready";
    await file.save();
  } catch (err: any) {
    file.status = "failed";
    file.errorMessage = "Could not read this file's contents.";
    await file.save();
  }

  sendSuccess(res, { file: toDTO(file) }, "File uploaded", 201);
});

export const listFiles = asyncHandler(async (req: Request, res: Response) => {
  const files = await FileAsset.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(100);
  sendSuccess(res, { files: files.map(toDTO) });
});

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const file = await FileAsset.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!file) throw ApiError.notFound("File not found");

  await fs.unlink(absoluteUploadPath(file.storageName)).catch(() => {
    // File may already be gone from disk — deleting the DB record still succeeds.
  });
  await file.deleteOne();

  sendSuccess(res, null, "File deleted");
});

export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  const file = await FileAsset.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!file) throw ApiError.notFound("File not found");

  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.fileName)}"`);
  res.sendFile(absoluteUploadPath(file.storageName));
});

export const fileActionSchema = z.object({
  action: z.enum(["summarize", "extract", "explain", "ask"]),
  question: z.string().max(2000).optional(),
});

const ACTION_PROMPTS: Record<string, string> = {
  summarize: "Summarize the following document in a few clear paragraphs.",
  extract: "Extract the key facts, figures, and structured data from the following document as a list.",
  explain: "Explain the following document in plain language a non-expert could understand.",
};

export const runFileAction = asyncHandler(async (req: Request, res: Response) => {
  const { action, question } = req.body as z.infer<typeof fileActionSchema>;

  const file = await FileAsset.findOne({ _id: req.params.id, userId: req.user!.id }).select("+extractedText");
  if (!file) throw ApiError.notFound("File not found");

  if (!file.extractedText) {
    throw ApiError.badRequest(
      "This file has no extractable text (e.g. it's an image), so it can't be analyzed as a document yet."
    );
  }

  if (action === "ask" && !question?.trim()) {
    throw ApiError.badRequest("Please include a question to ask about this file.");
  }

  const instruction = action === "ask" ? question!.trim() : ACTION_PROMPTS[action];
  const provider = getAIProvider();

  const result = await provider.generateText({
    history: [
      {
        role: "user",
        content: `${instruction}\n\n--- Document: ${file.fileName} ---\n${file.extractedText}`,
      },
    ],
    systemPrompt:
      "You are analyzing a user-uploaded document. Base your answer only on the document content provided.",
  });

  sendSuccess(res, { fileId: file.id, action, result });
});
