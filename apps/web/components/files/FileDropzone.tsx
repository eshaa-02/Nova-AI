"use client";

import { useRef, useState, type DragEvent } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useFilesStore } from "@/stores/files.store";

export function FileDropzone() {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, uploading } = useFilesStore();

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) uploadFile(file).catch(() => {});
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors",
        dragging ? "border-accent bg-accent-soft/30" : "border-border hover:border-accent/40"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt,.csv,.png,.jpg,.jpeg,.webp"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <Loader2 size={22} className="animate-spin text-accent" />
      ) : (
        <UploadCloud size={22} className="text-accent" strokeWidth={1.5} />
      )}
      <p className="mt-3 text-sm text-text">
        {uploading ? "Uploading..." : "Drag and drop a file, or click to browse"}
      </p>
      <p className="mt-1 text-xs text-muted">PDF, DOCX, TXT, CSV, PNG, JPEG, WEBP — up to 15MB</p>
    </div>
  );
}
