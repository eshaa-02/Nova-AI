import type { Request, Response } from "express";
import { z } from "zod";
import { GeneratedVideo } from "../models/GeneratedVideo";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { getVideoProvider } from "../services/video/VideoProviderFactory";
import { saveBufferToUpload, absoluteUploadPath } from "../middleware/upload";
import fs from "fs/promises";

function toDTO(v: any) {
  return {
    id: v._id.toString(),
    prompt: v.prompt,
    style: v.style,
    durationSeconds: v.durationSeconds,
    aspectRatio: v.aspectRatio,
    status: v.status,
    errorMessage: v.errorMessage,
    hasVideo: Boolean(v.storageName),
    createdAt: v.createdAt.toISOString(),
  };
}

export const generateVideoSchema = z.object({
  prompt: z.string().trim().min(1, "Describe the video you want to create").max(2000),
  style: z.string().max(60).optional(),
  durationSeconds: z.number().int().min(2).max(30).default(5),
  aspectRatio: z.enum(["1:1", "16:9", "9:16"]).default("16:9"),
});

export const generateVideo = asyncHandler(async (req: Request, res: Response) => {
  const { prompt, style, durationSeconds, aspectRatio } = req.body as z.infer<typeof generateVideoSchema>;

  const provider = getVideoProvider();
  if (!provider.configured) {
    throw ApiError.serviceUnavailable(
      "Video generation isn't configured. Set VIDEO_PROVIDER and its API key on the backend to enable it."
    );
  }

  const doc = await GeneratedVideo.create({
    userId: req.user!.id,
    prompt,
    style,
    durationSeconds,
    aspectRatio,
    status: "generating",
  });

  sendSuccess(res, { video: toDTO(doc) }, "Generation started", 202);

  try {
    const result = await provider.generateVideo({ prompt, style, durationSeconds, aspectRatio });
    const storageName = await saveBufferToUpload(Buffer.from(result.base64, "base64"), result.mimeType);
    doc.storageName = storageName;
    doc.mimeType = result.mimeType;
    doc.status = "ready";
    await doc.save();
  } catch (err: any) {
    doc.status = "failed";
    doc.errorMessage = err?.message || "Video generation failed.";
    await doc.save();
  }
});

export const listVideos = asyncHandler(async (req: Request, res: Response) => {
  const videos = await GeneratedVideo.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(50);
  sendSuccess(res, { videos: videos.map(toDTO) });
});

export const getVideoFile = asyncHandler(async (req: Request, res: Response) => {
  const video = await GeneratedVideo.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!video || !video.storageName || !video.mimeType) throw ApiError.notFound("Video not found");
  res.setHeader("Content-Type", video.mimeType);
  res.sendFile(absoluteUploadPath(video.storageName));
});

export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const video = await GeneratedVideo.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!video) throw ApiError.notFound("Video not found");
  if (video.storageName) await fs.unlink(absoluteUploadPath(video.storageName)).catch(() => {});
  await video.deleteOne();
  sendSuccess(res, null, "Video deleted");
});
