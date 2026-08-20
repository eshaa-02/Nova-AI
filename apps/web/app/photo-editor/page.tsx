"use client";

import { useRef, useState } from "react";
import {
  Upload,
  Eraser,
  Sparkles,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  Crop,
  Maximize,
  Loader2,
} from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { usePhotoEditorStore } from "@/stores/photoEditor.store";
import { cropToAspect, resizeTo } from "@/lib/utils/canvasEdits";

const ASPECT_PRESETS = ["1:1", "4:5", "16:9", "9:16"];

export default function PhotoEditorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    history,
    index,
    processing,
    error,
    loadImage,
    undo,
    redo,
    reset,
    runAIEdit,
    applyCanvasEdit,
  } = usePhotoEditorStore();

  const [customPrompt, setCustomPrompt] = useState("");
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(800);

  const currentUrl = history[index];
  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadImage(file);
  }

  function handleDownload() {
    if (!currentUrl) return;
    const a = document.createElement("a");
    a.href = currentUrl;
    a.download = "nova-ai-edit.png";
    a.click();
  }

  return (
    <ChatShell>
      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <div className="flex w-16 flex-none flex-col items-center gap-2 border-r border-border py-4">
          <ToolButton icon={Upload} label="Upload" onClick={() => fileInputRef.current?.click()} />
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} />
          <ToolButton
            icon={Eraser}
            label="Remove background"
            disabled={!currentUrl || processing}
            onClick={() => runAIEdit("remove-background")}
          />
          <ToolButton
            icon={Sparkles}
            label="Enhance"
            disabled={!currentUrl || processing}
            onClick={() => runAIEdit("enhance")}
          />
          <div className="my-1 h-px w-8 bg-border" />
          <ToolButton icon={Undo2} label="Undo" disabled={!canUndo} onClick={undo} />
          <ToolButton icon={Redo2} label="Redo" disabled={!canRedo} onClick={redo} />
          <ToolButton icon={RotateCcw} label="Reset" disabled={!currentUrl} onClick={reset} />
          <div className="my-1 h-px w-8 bg-border" />
          <ToolButton icon={Download} label="Export" disabled={!currentUrl} onClick={handleDownload} />
        </div>

        {/* Center canvas */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          <header className="flex h-14 flex-none items-center border-b border-border px-4 sm:px-6">
            <h1 className="text-sm font-medium text-text">Photo Editor</h1>
          </header>

          {error && <p className="border-b border-error/20 bg-error/5 px-4 py-2 text-sm text-error">{error}</p>}

          <div className="flex flex-1 items-center justify-center p-8">
            {!currentUrl ? (
              <EmptyState
                icon={Upload}
                title="Upload a photo to get started"
                description="PNG, JPEG, or WEBP. Then remove backgrounds, enhance, crop, resize, or edit with a prompt."
                action={<Button size="sm" onClick={() => fileInputRef.current?.click()}>Upload photo</Button>}
              />
            ) : (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentUrl} alt="Current edit" className="max-h-[65vh] max-w-full rounded-md border border-border object-contain" />
                {processing && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/40">
                    <Loader2 size={22} className="animate-spin text-white" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right properties panel */}
        <div className="w-72 flex-none overflow-y-auto border-l border-border p-5">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Edit with prompt</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Describe what you want to change..."
              rows={4}
              className="mt-2 w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <Button
              size="sm"
              className="mt-2 w-full"
              disabled={!currentUrl || !customPrompt.trim() || processing}
              onClick={() => runAIEdit("custom", customPrompt.trim())}
            >
              Generate edit
            </Button>
          </div>

          <div className="mt-8">
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Crop</label>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {ASPECT_PRESETS.map((ratio) => (
                <button
                  key={ratio}
                  disabled={!currentUrl}
                  onClick={() => applyCanvasEdit(cropToAspect(ratio))}
                  className="flex items-center justify-center gap-1 rounded-md border border-border py-1.5 text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-text disabled:opacity-40"
                >
                  <Crop size={11} />
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <label className="text-xs font-medium uppercase tracking-wide text-muted">Resize</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-text focus:border-accent focus:outline-none"
              />
              <span className="text-xs text-muted">×</span>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-text focus:border-accent focus:outline-none"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="mt-2 w-full gap-1.5"
              disabled={!currentUrl || width < 1 || height < 1}
              onClick={() => applyCanvasEdit(resizeTo(width, height))}
            >
              <Maximize size={13} /> Apply
            </Button>
          </div>
        </div>
      </div>
    </ChatShell>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Upload;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface hover:text-text disabled:opacity-30"
    >
      <Icon size={17} strokeWidth={1.75} />
    </button>
  );
}
