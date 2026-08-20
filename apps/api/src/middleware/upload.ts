import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

const UPLOAD_ROOT = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
  filename: (_req, file, cb) => {
    // Never trust the client-supplied filename for the on-disk path —
    // generate a random name and pin the extension to the validated MIME type.
    const ext = ALLOWED_MIME_EXTENSIONS[file.mimetype] || "";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const uploadSingleFile = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_EXTENSIONS[file.mimetype]) {
      return cb(
        ApiError.badRequest(
          `Unsupported file type "${file.mimetype}". Allowed: PDF, DOCX, TXT, CSV, PNG, JPEG, WEBP.`
        ) as unknown as Error
      );
    }
    cb(null, true);
  },
}).single("file");

const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/** In-memory upload for photo-editor source images — never written to disk, only the AI result is. */
export const uploadImageMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      return cb(
        ApiError.badRequest(`Unsupported image type "${file.mimetype}". Allowed: PNG, JPEG, WEBP.`) as unknown as Error
      );
    }
    cb(null, true);
  },
}).single("image");

export function absoluteUploadPath(storageName: string): string {
  return path.join(UPLOAD_ROOT, storageName);
}

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
};

/** Writes an arbitrary buffer (e.g. a generated image) to the upload directory under a random name. */
export async function saveBufferToUpload(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = MIME_EXTENSIONS[mimeType] || ".bin";
  const storageName = `${crypto.randomUUID()}${ext}`;
  await fs.promises.writeFile(path.join(UPLOAD_ROOT, storageName), buffer);
  return storageName;
}
