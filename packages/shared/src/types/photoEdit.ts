export type PhotoEditOperation = "remove-background" | "enhance" | "custom";
export type PhotoEditStatus = "processing" | "ready" | "failed";

export interface PhotoEdit {
  id: string;
  operation: PhotoEditOperation;
  prompt: string;
  status: PhotoEditStatus;
  errorMessage?: string;
  hasResult: boolean;
  createdAt: string;
}
