import { Schema, model, Document, Types } from "mongoose";

export type GeneratedMusicStatus = "generating" | "ready" | "failed";

export interface IGeneratedMusic extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  prompt: string;
  genre?: string;
  mood?: string;
  durationSeconds: number;
  instrumental: boolean;
  storageName?: string;
  mimeType?: string;
  status: GeneratedMusicStatus;
  errorMessage?: string;
  createdAt: Date;
}

const generatedMusicSchema = new Schema<IGeneratedMusic>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    prompt: { type: String, required: true },
    genre: { type: String },
    mood: { type: String },
    durationSeconds: { type: Number, default: 30 },
    instrumental: { type: Boolean, default: false },
    storageName: { type: String },
    mimeType: { type: String },
    status: { type: String, enum: ["generating", "ready", "failed"], default: "generating" },
    errorMessage: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const GeneratedMusic = model<IGeneratedMusic>("GeneratedMusic", generatedMusicSchema);
