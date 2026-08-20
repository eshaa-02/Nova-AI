"use client";

import { useEffect } from "react";
import { FileText } from "lucide-react";
import { ChatShell } from "@/components/chat/ChatShell";
import { FileDropzone } from "@/components/files/FileDropzone";
import { FileCard } from "@/components/files/FileCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFilesStore } from "@/stores/files.store";

export default function FilesPage() {
  const { files, loadFiles } = useFilesStore();

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return (
    <ChatShell>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex h-14 flex-none items-center border-b border-border px-4 sm:px-6">
          <h1 className="text-sm font-medium text-text">Files</h1>
        </header>

        <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-0">
          <FileDropzone />

          <div className="mt-8">
            {files.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No files uploaded"
                description="Upload a document to summarize, extract data from, or ask questions about it."
              />
            ) : (
              <div className="flex flex-col gap-3">
                {files.map((f) => (
                  <FileCard key={f.id} file={f} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ChatShell>
  );
}
