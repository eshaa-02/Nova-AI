export interface GenerateMusicOptions {
  prompt: string;
  genre?: string;
  mood?: string;
  durationSeconds?: number;
  instrumental?: boolean;
}

export interface GeneratedMusicData {
  base64: string;
  mimeType: string;
}

export interface MusicProvider {
  readonly name: string;
  readonly configured: boolean;
  generateMusic(options: GenerateMusicOptions): Promise<GeneratedMusicData>;
}
