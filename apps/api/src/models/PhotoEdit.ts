import { Schema, model, Document, Types } from "mongoose";

export type PhotoEditStatus = "processing" | "ready" | "failed";

export interface IPhotoEdit extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  operation: "remove-background" | "enhance" | "custom";
  prompt: string;
  resultStorageName?: string;
  mimeType?: string;
  status: PhotoEditStatus;
  errorMessage?: string;
  createdAt: Date;
}

const photoEditSchema = new Schema<IPhotoEdit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    operation: { type: String, enum: ["remove-background", "enhance", "custom"], required: true },
    prompt: { type: String, required: true },
    resultStorageName: { type: String },
    mimeType: { type: String },
    status: { type: String, enum: ["processing", "ready", "failed"], default: "processing" },
    errorMessage: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PhotoEdit = model<IPhotoEdit>("PhotoEdit", photoEditSchema);
