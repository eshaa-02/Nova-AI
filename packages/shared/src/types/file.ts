export type FileStatus = "uploading" | "processing" | "ready" | "failed";

export interface FileAsset {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: FileStatus;
  /** Populated once text has been extracted server-side (documents only). */
  hasExtractedText: boolean;
  errorMessage?: string;
  createdAt: string;
}

export type FileActionKind = "summarize" | "extract" | "explain";

export interface FileActionResult {
  fileId: string;
  action: FileActionKind | "ask";
  result: string;
}
