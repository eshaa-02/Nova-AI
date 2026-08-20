import type { Request, Response } from "express";
import fs from "fs/promises";
import { z } from "zod";
import { PhotoEdit } from "../models/PhotoEdit";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getAIProvider } from "../services/ai/AIProviderFactory";
import { saveBufferToUpload, absoluteUploadPath } from "../middleware/upload";

function toDTO(edit: any) {
  return {
    id: edit._id.toString(),
    operation: edit.operation,
    prompt: edit.prompt,
    status: edit.status,
    errorMessage: edit.errorMessage,
    hasResult: Boolean(edit.resultStorageName),
    createdAt: edit.createdAt.toISOString(),
  };
}

const OPERATION_PROMPTS: Record<string, string> = {
  "remove-background": "Remove the background from this image entirely, leaving the main subject on a plain transparent or white background. Keep the subject unchanged.",
  enhance: "Enhance this image: improve lighting, sharpness, and color balance. Do not change the subject or composition.",
};

export const editImageSchema = z.object({
  operation: z.enum(["remove-background", "enhance", "custom"]),
  prompt: z.string().max(2000).optional(),
});

export const runPhotoEdit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No image was uploaded.");
  }
  const { operation, prompt: customPrompt } = req.body as z.infer<typeof editImageSchema>;

  if (operation === "custom" && !customPrompt?.trim()) {
    throw ApiError.badRequest("Describe what you want to change.");
  }

  const provider = getAIProvider();
  if (!provider.capabilities.imageEditing || !provider.editImage) {
    throw ApiError.serviceUnavailable(
      "Photo editing isn't configured. The active AI provider doesn't support it — set GOOGLE_IMAGE_MODEL to enable it."
    );
  }

  const prompt = operation === "custom" ? customPrompt!.trim() : OPERATION_PROMPTS[operation];

  const edit = await PhotoEdit.create({
    userId: req.user!.id,
    operation,
    prompt,
    status: "processing",
  });

  try {
    const result = await provider.editImage({
      imageBase64: req.file.buffer.toString("base64"),
      mimeType: req.file.mimetype,
      prompt,
    });
    const storageName = await saveBufferToUpload(Buffer.from(result.base64, "base64"), result.mimeType);
    edit.resultStorageName = storageName;
    edit.mimeType = result.mimeType;
    edit.status = "ready";
    await edit.save();
  } catch (err: any) {
    edit.status = "failed";
    edit.errorMessage = err?.message || "The edit failed. Please try again.";
    await edit.save();
  }

  sendSuccess(res, { edit: toDTO(edit) }, edit.status === "ready" ? "Edit complete" : undefined);
});

export const listPhotoEdits = asyncHandler(async (req: Request, res: Response) => {
  const edits = await PhotoEdit.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(50);
  sendSuccess(res, { edits: edits.map(toDTO) });
});

export const getPhotoEditFile = asyncHandler(async (req: Request, res: Response) => {
  const edit = await PhotoEdit.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!edit || !edit.resultStorageName || !edit.mimeType) {
    throw ApiError.notFound("Edit not found");
  }
  res.setHeader("Content-Type", edit.mimeType);
  res.sendFile(absoluteUploadPath(edit.resultStorageName));
});

export const deletePhotoEdit = asyncHandler(async (req: Request, res: Response) => {
  const edit = await PhotoEdit.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!edit) throw ApiError.notFound("Edit not found");

  if (edit.resultStorageName) {
    await fs.unlink(absoluteUploadPath(edit.resultStorageName)).catch(() => {});
  }
  await edit.deleteOne();

  sendSuccess(res, null, "Edit deleted");
});
