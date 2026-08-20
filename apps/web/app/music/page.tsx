"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Music as MusicIcon, Loader2, AlertTriangle, Download, Trash2, Sparkles } from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useMusicStore } from "@/stores/music.store";
import { useAuthenticatedBlobUrl } from "@/lib/utils/useAuthenticatedBlobUrl";
import { NovaApiClient } from "@/lib/api/client";
import type { GeneratedMusicTrack } from "@nova-ai/shared";
import { cn } from "@/lib/utils/cn";

const GENRES = ["Lo-fi", "Cinematic", "Electronic", "Acoustic", "Jazz", "Orchestral"];
const MOODS = ["Calm", "Energetic", "Melancholic", "Uplifting"];

export default function MusicGeneratorPage() {
  const { tracks, generating, generate, loadHistory } = useMusicStore();
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState<string | undefined>(undefined);
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState(30);
  const [instrumental, setInstrumental] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || generating) return;
    generate({ prompt: prompt.trim(), genre, mood, durationSeconds: duration, instrumental }).catch(() => {});
  }

  return (
    <ChatShell>
      <div className="flex flex-1 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex w-72 flex-none flex-col gap-6 border-r border-border p-5">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the track you want to create..."
              rows={4}
              className="mt-2 w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Genre</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(genre === g ? undefined : g)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    genre === g ? "border-accent bg-accent-soft text-accent" : "border-border text-text-secondary hover:text-text"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Mood</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(mood === m ? undefined : m)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    mood === m ? "border-accent bg-accent-soft text-accent" : "border-border text-text-secondary hover:text-text"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Duration: {duration}s</label>
            <input
              type="range"
              min={10}
              max={180}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-2 w-full accent-accent"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} className="accent-accent" />
            Instrumental only
          </label>

          <Button type="submit" loading={generating} disabled={!prompt.trim()} className="gap-2">
            <Sparkles size={15} />
            {generating ? "Creating..." : "Generate"}
          </Button>
        </form>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <header className="flex h-14 flex-none items-center border-b border-border px-4 sm:px-6">
            <h1 className="text-sm font-medium text-text">Music Generator</h1>
          </header>

          {tracks.length === 0 ? (
            <EmptyState
              icon={MusicIcon}
              title="No generated tracks yet"
              description="Describe the track you'd like to create and Nova will generate it here."
            />
          ) : (
            <div className="flex flex-col gap-3 p-5">
              {tracks.map((t) => (
                <TrackRow key={t.id} track={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ChatShell>
  );
}

function TrackRow({ track }: { track: GeneratedMusicTrack }) {
  const deleteTrack = useMusicStore((s) => s.deleteTrack);
  const { url } = useAuthenticatedBlobUrl(track.status === "ready" ? `/api/music/${track.id}/file` : null);

  async function handleDownload() {
    const blobUrl = await NovaApiClient.getBlobUrl(`/api/music/${track.id}/file`);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `nova-ai-${track.id}.mp3`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-text">{track.prompt}</p>
          <p className="mt-0.5 text-xs text-muted">
            {[track.genre, track.mood, `${track.durationSeconds}s`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-none gap-1">
          {track.status === "ready" && (
            <button onClick={handleDownload} aria-label="Download" className="rounded-md p-1.5 text-muted hover:bg-background hover:text-text">
              <Download size={13} />
            </button>
          )}
          <button onClick={() => deleteTrack(track.id)} aria-label="Delete" className="rounded-md p-1.5 text-muted hover:bg-error/10 hover:text-error">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {track.status === "generating" && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <Loader2 size={12} className="animate-spin" /> Creating...
        </div>
      )}
      {track.status === "failed" && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-error">
          <AlertTriangle size={12} /> {track.errorMessage || "Generation failed"}
        </div>
      )}
      {track.status === "ready" && url && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio src={url} controls className="mt-3 w-full" />
      )}
    </div>
  );
}
