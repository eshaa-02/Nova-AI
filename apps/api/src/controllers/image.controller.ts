import type { Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { GeneratedImage } from "../models/GeneratedImage";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getAIProvider } from "../services/ai/AIProviderFactory";
import { saveBufferToUpload, absoluteUploadPath } from "../middleware/upload";
import fs from "fs/promises";

function toDTO(img: any) {
  return {
    id: img._id.toString(),
    groupId: img.groupId,
    prompt: img.prompt,
    style: img.style,
    aspectRatio: img.aspectRatio,
    status: img.status,
    errorMessage: img.errorMessage,
    hasImage: Boolean(img.storageName),
    createdAt: img.createdAt.toISOString(),
  };
}

export const generateImagesSchema = z.object({
  prompt: z.string().trim().min(1, "Describe what you want to create").max(2000),
  style: z.string().max(60).optional(),
  aspectRatio: z.enum(["1:1", "4:5", "16:9", "9:16"]).default("1:1"),
  count: z.number().int().min(1).max(4).default(1),
});

export const generateImages = asyncHandler(async (req: Request, res: Response) => {
  const { prompt, style, aspectRatio, count } = req.body as z.infer<typeof generateImagesSchema>;

  const provider = getAIProvider();
  if (!provider.capabilities.imageGeneration || !provider.generateImage) {
    throw ApiError.serviceUnavailable(
      "Image generation isn't configured. The active AI provider doesn't support it — set GOOGLE_IMAGE_MODEL to enable it."
    );
  }

  const groupId = crypto.randomUUID();
  const fullPrompt = style ? `${prompt}. Style: ${style}.` : prompt;

  // Create placeholder records up front so the client can poll/see "generating" state.

  const placeholders = await GeneratedImage.insertMany(
    Array.from({ length: count }).map(() => ({
      userId: req.user!.id,
      groupId,
      prompt,
      style,
      aspectRatio,
      status: "generating" as "generating" | "ready" | "failed",
    }))
  );

  sendSuccess(res, { images: placeholders.map(toDTO) }, "Generation started", 202);

  // Generate after responding — the frontend polls GET /api/images?groupId=
  // for completion rather than holding the HTTP request open for a
  // potentially slow multi-image generation.
  try {
    const results = await provider.generateImage({ prompt: fullPrompt, aspectRatio, count });

    await Promise.all(
      placeholders.map(async (doc, i) => {
        const result = results[i];
        if (!result) {
          doc.status = "failed";
          doc.errorMessage = "The provider returned fewer images than requested.";
          return doc.save();
        }
        try {
          const buffer = Buffer.from(result.base64, "base64");
          const storageName = await saveBufferToUpload(buffer, result.mimeType);
          doc.storageName = storageName;
          doc.mimeType = result.mimeType;
          doc.status = "ready";
          await doc.save();
        } catch (err: any) {
          doc.status = "failed";
          doc.errorMessage = err?.message || "Failed to save the generated image.";
          await doc.save();
        }
      })
    );
  } catch (err: any) {
    await GeneratedImage.updateMany(
      { groupId, status: "generating" },
      { $set: { status: "failed", errorMessage: err?.message || "Image generation failed." } }
    );
  }
});

export const listImages = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.query as { groupId?: string };
  const filter: Record<string, unknown> = { userId: req.user!.id };
  if (groupId) filter.groupId = groupId;

  const images = await GeneratedImage.find(filter).sort({ createdAt: -1 }).limit(100);
  sendSuccess(res, { images: images.map(toDTO) });
});

export const getImageFile = asyncHandler(async (req: Request, res: Response) => {
  const image = await GeneratedImage.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!image || !image.storageName || !image.mimeType) {
    throw ApiError.notFound("Image not found");
  }
  res.setHeader("Content-Type", image.mimeType);
  res.sendFile(absoluteUploadPath(image.storageName));
});

export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const image = await GeneratedImage.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!image) throw ApiError.notFound("Image not found");

  if (image.storageName) {
    await fs.unlink(absoluteUploadPath(image.storageName)).catch(() => { });
  }
  await image.deleteOne();

  sendSuccess(res, null, "Image deleted");
});
