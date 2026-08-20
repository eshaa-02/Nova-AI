"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { ImageGeneratorForm } from "@/components/image/ImageGeneratorForm";
import { ImageResultGrid } from "@/components/image/ImageResultGrid";
import { useImagesStore } from "@/stores/images.store";

export default function ImageGeneratorPage() {
  const { images, generating, error, generate, loadHistory } = useImagesStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <ChatShell>
      <div className="flex flex-1 overflow-hidden">
        <ImageGeneratorForm onGenerate={(params) => generate(params).catch(() => {})} generating={generating} />

        <div className="flex flex-1 flex-col overflow-y-auto">
          <header className="flex h-14 flex-none items-center border-b border-border px-4 sm:px-6">
            <h1 className="text-sm font-medium text-text">Image Generator</h1>
          </header>

          {error && (
            <div className="flex items-center gap-2 border-b border-error/20 bg-error/5 px-4 py-2 text-sm text-error">
              <AlertCircle size={14} className="flex-none" />
              {error}
            </div>
          )}

          <ImageResultGrid images={images} />
        </div>
      </div>
    </ChatShell>
  );
}
