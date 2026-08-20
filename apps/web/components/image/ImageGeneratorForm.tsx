"use client";

import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { ImageAspectRatio } from "@nova-ai/shared";

const ASPECT_RATIOS: ImageAspectRatio[] = ["1:1", "4:5", "16:9", "9:16"];
const STYLES = ["Photorealistic", "Cinematic", "Editorial", "Illustration", "3D", "Minimal", "Anime", "Artistic"];

export function ImageGeneratorForm({
  onGenerate,
  generating,
}: {
  onGenerate: (params: { prompt: string; style?: string; aspectRatio: ImageAspectRatio; count: number }) => void;
  generating: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string | undefined>(undefined);
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("1:1");
  const [count, setCount] = useState(1);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || generating) return;
    onGenerate({ prompt: prompt.trim(), style, aspectRatio, count });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-72 flex-none flex-col gap-6 border-r border-border p-5">
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to create..."
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
        <div className="mt-2 grid grid-cols-4 gap-1.5">
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
        <label className="text-xs font-medium uppercase tracking-wide text-muted">Number of images</label>
        <div className="mt-2 flex gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={cn(
                "h-8 w-8 rounded-md border text-xs transition-colors",
                count === n ? "border-accent bg-accent-soft text-accent" : "border-border text-text-secondary hover:text-text"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" loading={generating} disabled={!prompt.trim()} className="gap-2">
        <Sparkles size={15} />
        {generating ? "Creating..." : "Generate"}
      </Button>
    </form>
  );
}
