import { Schema, model, Document, Types } from "mongoose";

export type GeneratedVideoStatus = "generating" | "ready" | "failed";

export interface IGeneratedVideo extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  prompt: string;
  style?: string;
  durationSeconds: number;
  aspectRatio: string;
  storageName?: string;
  mimeType?: string;
  status: GeneratedVideoStatus;
  errorMessage?: string;
  createdAt: Date;
}

const generatedVideoSchema = new Schema<IGeneratedVideo>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    prompt: { type: String, required: true },
    style: { type: String },
    durationSeconds: { type: Number, default: 5 },
    aspectRatio: { type: String, default: "16:9" },
    storageName: { type: String },
    mimeType: { type: String },
    status: { type: String, enum: ["generating", "ready", "failed"], default: "generating" },
    errorMessage: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const GeneratedVideo = model<IGeneratedVideo>("GeneratedVideo", generatedVideoSchema);
