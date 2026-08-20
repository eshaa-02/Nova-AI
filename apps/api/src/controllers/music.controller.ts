import type { Request, Response } from "express";
import { z } from "zod";
import { GeneratedMusic } from "../models/GeneratedMusic";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { getMusicProvider } from "../services/music/MusicProviderFactory";
import { saveBufferToUpload, absoluteUploadPath } from "../middleware/upload";
import fs from "fs/promises";

function toDTO(m: any) {
  return {
    id: m._id.toString(),
    prompt: m.prompt,
    genre: m.genre,
    mood: m.mood,
    durationSeconds: m.durationSeconds,
    instrumental: m.instrumental,
    status: m.status,
    errorMessage: m.errorMessage,
    hasTrack: Boolean(m.storageName),
    createdAt: m.createdAt.toISOString(),
  };
}

export const generateMusicSchema = z.object({
  prompt: z.string().trim().min(1, "Describe the track you want to create").max(2000),
  genre: z.string().max(60).optional(),
  mood: z.string().max(60).optional(),
  durationSeconds: z.number().int().min(10).max(180).default(30),
  instrumental: z.boolean().default(false),
});

export const generateMusic = asyncHandler(async (req: Request, res: Response) => {
  const { prompt, genre, mood, durationSeconds, instrumental } = req.body as z.infer<
    typeof generateMusicSchema
  >;

  const provider = getMusicProvider();
  if (!provider.configured) {
    throw ApiError.serviceUnavailable(
      "Music generation isn't configured. Set MUSIC_PROVIDER and its API key on the backend to enable it."
    );
  }

  const doc = await GeneratedMusic.create({
    userId: req.user!.id,
    prompt,
    genre,
    mood,
    durationSeconds,
    instrumental,
    status: "generating",
  });

  sendSuccess(res, { track: toDTO(doc) }, "Generation started", 202);

  try {
    const result = await provider.generateMusic({ prompt, genre, mood, durationSeconds, instrumental });
    const storageName = await saveBufferToUpload(Buffer.from(result.base64, "base64"), result.mimeType);
    doc.storageName = storageName;
    doc.mimeType = result.mimeType;
    doc.status = "ready";
    await doc.save();
  } catch (err: any) {
    doc.status = "failed";
    doc.errorMessage = err?.message || "Music generation failed.";
    await doc.save();
  }
});

export const listMusic = asyncHandler(async (req: Request, res: Response) => {
  const tracks = await GeneratedMusic.find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(50);
  sendSuccess(res, { tracks: tracks.map(toDTO) });
});

export const getMusicFile = asyncHandler(async (req: Request, res: Response) => {
  const track = await GeneratedMusic.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!track || !track.storageName || !track.mimeType) throw ApiError.notFound("Track not found");
  res.setHeader("Content-Type", track.mimeType);
  res.sendFile(absoluteUploadPath(track.storageName));
});

export const deleteMusic = asyncHandler(async (req: Request, res: Response) => {
  const track = await GeneratedMusic.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!track) throw ApiError.notFound("Track not found");
  if (track.storageName) await fs.unlink(absoluteUploadPath(track.storageName)).catch(() => {});
  await track.deleteOne();
  sendSuccess(res, null, "Track deleted");
});
