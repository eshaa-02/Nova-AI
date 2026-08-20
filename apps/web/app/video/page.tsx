"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Video as VideoIcon, Loader2, AlertTriangle, Download, Trash2, Sparkles } from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useVideoStore } from "@/stores/video.store";
import { useAuthenticatedBlobUrl } from "@/lib/utils/useAuthenticatedBlobUrl";
import { NovaApiClient } from "@/lib/api/client";
import type { GeneratedVideo } from "@nova-ai/shared";
import { cn } from "@/lib/utils/cn";

const ASPECT_RATIOS: GeneratedVideo["aspectRatio"][] = ["16:9", "1:1", "9:16"];
const STYLES = ["Cinematic", "Realistic", "Animated", "Abstract"];

export default function VideoGeneratorPage() {
  const { videos, generating, generate, loadHistory } = useVideoStore();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState<GeneratedVideo["aspectRatio"]>("16:9");

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || generating) return;
    generate({ prompt: prompt.trim(), style, durationSeconds: duration, aspectRatio }).catch(() => {});
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
              placeholder="Describe the video you want to create..."
              rows={5}
              className="mt-2 w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Style</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStyle(style === s ? undefined : s)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    style === s ? "border-accent bg-accent-soft text-accent" : "border-border text-text-secondary hover:text-text"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Aspect ratio</label>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={cn(
                    "rounded-md border py-1.5 text-xs transition-colors",
                    aspectRatio === ratio ? "border-accent bg-accent-soft text-accent" : "border-border text-text-secondary hover:text-text"
                  )}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Duration: {duration}s</label>
            <input
              type="range"
              min={2}
              max={30}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-2 w-full accent-accent"
            />
          </div>

          <Button type="submit" loading={generating} disabled={!prompt.trim()} className="gap-2">
            <Sparkles size={15} />
            {generating ? "Creating..." : "Generate"}
          </Button>
        </form>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <header className="flex h-14 flex-none items-center border-b border-border px-4 sm:px-6">
            <h1 className="text-sm font-medium text-text">Video Generator</h1>
          </header>

          {videos.length === 0 ? (
            <EmptyState
              icon={VideoIcon}
              title="No generated videos yet"
              description="Describe what you'd like to create and Nova will generate it here."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              {videos.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ChatShell>
  );
}

function VideoCard({ video }: { video: GeneratedVideo }) {
  const deleteVideo = useVideoStore((s) => s.deleteVideo);
  const { url } = useAuthenticatedBlobUrl(video.status === "ready" ? `/api/videos/${video.id}/file` : null);

  async function handleDownload() {
    const blobUrl = await NovaApiClient.getBlobUrl(`/api/videos/${video.id}/file`);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `nova-ai-${video.id}.mp4`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex aspect-video items-center justify-center bg-background">
        {video.status === "generating" && (
          <div className="flex flex-col items-center gap-2 text-muted">
            <Loader2 size={18} className="animate-spin text-accent" />
            <span className="text-xs">Creating...</span>
          </div>
        )}
        {video.status === "failed" && (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-error">
            <AlertTriangle size={18} />
            <span className="text-xs">{video.errorMessage || "Generation failed"}</span>
          </div>
        )}
        {video.status === "ready" && url && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={url} controls className="h-full w-full object-contain" />
        )}
      </div>
      <div className="flex items-center justify-between p-3">
        <p className="truncate text-xs text-text-secondary">{video.prompt}</p>
        <div className="flex flex-none gap-1">
          {video.status === "ready" && (
            <button onClick={handleDownload} aria-label="Download" className="rounded-md p-1.5 text-muted hover:bg-background hover:text-text">
              <Download size={13} />
            </button>
          )}
          <button onClick={() => deleteVideo(video.id)} aria-label="Delete" className="rounded-md p-1.5 text-muted hover:bg-error/10 hover:text-error">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
