"use client";

import { Loader2, AlertTriangle, Download, Trash2, ImageIcon } from "lucide-react";
import type { GeneratedImage } from "@nova-ai/shared";
import { AuthenticatedImage } from "./AuthenticatedImage";
import { EmptyState } from "@/components/ui/EmptyState";
import { NovaApiClient } from "@/lib/api/client";
import { useImagesStore } from "@/stores/images.store";

const ASPECT_CLASSES: Record<string, string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
};

export function ImageResultGrid({ images }: { images: GeneratedImage[] }) {
  const deleteImage = useImagesStore((s) => s.deleteImage);

  async function handleDownload(image: GeneratedImage) {
    const url = await NovaApiClient.getBlobUrl(`/api/images/${image.id}/file`);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nova-ai-${image.id}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (images.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="No generated images yet"
        description="Describe what you'd like to create and Nova will generate it here."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
      {images.map((image) => (
        <div key={image.id} className="group relative overflow-hidden rounded-lg border border-border bg-surface">
          <div className={ASPECT_CLASSES[image.aspectRatio] || "aspect-square"}>
            {image.status === "generating" && (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted">
                <Loader2 size={18} className="animate-spin text-accent" />
                <span className="text-xs">Creating...</span>
              </div>
            )}
            {image.status === "failed" && (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center text-error">
                <AlertTriangle size={18} />
                <span className="text-xs">{image.errorMessage || "Generation failed"}</span>
              </div>
            )}
            {image.status === "ready" && image.hasImage && (
              <AuthenticatedImage
                src={`/api/images/${image.id}/file`}
                alt={image.prompt}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {image.status === "ready" && (
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => handleDownload(image)}
                aria-label="Download"
                className="flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-white hover:bg-black/60"
              >
                <Download size={13} />
              </button>
              <button
                onClick={() => deleteImage(image.id)}
                aria-label="Delete"
                className="flex h-7 w-7 items-center justify-center rounded-md bg-black/40 text-white hover:bg-error/80"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
