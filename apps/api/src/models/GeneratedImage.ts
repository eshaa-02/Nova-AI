import { Schema, model, Document, Types } from "mongoose";

export type GeneratedImageStatus = "generating" | "ready" | "failed";

export interface IGeneratedImage extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  groupId: string;
  prompt: string;
  style?: string;
  aspectRatio: string;
  storageName?: string;
  mimeType?: string;
  status: GeneratedImageStatus;
  errorMessage?: string;
  createdAt: Date;
}

const generatedImageSchema = new Schema<IGeneratedImage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    groupId: { type: String, required: true, index: true },
    prompt: { type: String, required: true },
    style: { type: String },
    aspectRatio: { type: String, default: "1:1" },
    storageName: { type: String },
    mimeType: { type: String },
    status: { type: String, enum: ["generating", "ready", "failed"], default: "generating" },
    errorMessage: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const GeneratedImage = model<IGeneratedImage>("GeneratedImage", generatedImageSchema);
