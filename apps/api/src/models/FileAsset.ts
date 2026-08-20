import { Schema, model, Document, Types } from "mongoose";

export type FileStatus = "uploading" | "processing" | "ready" | "failed";

export interface IFileAsset extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fileName: string;
  /** Randomly generated on-disk name — never derived from the user-supplied filename. */
  storageName: string;
  mimeType: string;
  sizeBytes: number;
  status: FileStatus;
  extractedText?: string;
  errorMessage?: string;
  createdAt: Date;
}

const fileAssetSchema = new Schema<IFileAsset>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    storageName: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    status: { type: String, enum: ["uploading", "processing", "ready", "failed"], default: "processing" },
    extractedText: { type: String, select: false },
    errorMessage: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const FileAsset = model<IFileAsset>("FileAsset", fileAssetSchema);
