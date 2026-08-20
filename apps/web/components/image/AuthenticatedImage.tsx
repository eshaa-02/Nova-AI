"use client";

import { useEffect, useState } from "react";
import { NovaApiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

export function AuthenticatedImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    NovaApiClient.getBlobUrl(src)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setBlobUrl(url);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed) {
    return <div className={cn("flex items-center justify-center bg-surface text-xs text-muted", className)}>Failed to load</div>;
  }

  if (!blobUrl) {
    return <div className={cn("animate-pulse-soft bg-surface", className)} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={blobUrl} alt={alt} className={className} />;
}
