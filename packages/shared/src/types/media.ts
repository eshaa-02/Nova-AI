export type GenerationStatus = "generating" | "ready" | "failed";

export interface GeneratedVideo {
  id: string;
  prompt: string;
  style?: string;
  durationSeconds: number;
  aspectRatio: "1:1" | "16:9" | "9:16";
  status: GenerationStatus;
  errorMessage?: string;
  hasVideo: boolean;
  createdAt: string;
}

export interface GeneratedMusicTrack {
  id: string;
  prompt: string;
  genre?: string;
  mood?: string;
  durationSeconds: number;
  instrumental: boolean;
  status: GenerationStatus;
  errorMessage?: string;
  hasTrack: boolean;
  createdAt: string;
}
