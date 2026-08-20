export type GeneratedImageStatus = "generating" | "ready" | "failed";
export type ImageAspectRatio = "1:1" | "4:5" | "16:9" | "9:16";

export interface GeneratedImage {
  id: string;
  groupId: string;
  prompt: string;
  style?: string;
  aspectRatio: ImageAspectRatio;
  status: GeneratedImageStatus;
  errorMessage?: string;
  hasImage: boolean;
  createdAt: string;
}
