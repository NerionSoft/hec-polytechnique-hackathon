"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, CloudUpload, FolderUp, Loader2, X } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

type FileItem = {
  id: string;
  file: File;
  relativePath: string;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
  progress: number;
};

const CONCURRENCY = 4;

export function UploadDropzone({ dealId }: { dealId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "error").length;
  const inFlight = items.some((i) => i.status === "uploading" || i.status === "queued");

  async function handleEntries(entries: FileSystemEntry[]) {
    const collected: { file: File; relativePath: string }[] = [];
    for (const entry of entries) {
      await walkEntry(entry, "", collected);
    }
    enqueue(collected);
  }

  function handleFiles(files: File[]) {
    const collected = files.map((f) => ({
      file: f,
      relativePath: (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name,
    }));
    enqueue(collected);
  }

  function enqueue(collected: { file: File; relativePath: string }[]) {
    if (collected.length === 0) return;
    const newItems: FileItem[] = collected.map((c) => ({
      id: crypto.randomUUID(),
      file: c.file,
      relativePath: c.relativePath,
      status: "queued",
      progress: 0,
    }));
    setItems((prev) => [...newItems, ...prev]);
    void runQueue(newItems);
  }

  async function runQueue(newItems: FileItem[]) {
    const queue = [...newItems];
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        await uploadOne(item);
      }
    });
    await Promise.all(workers);
    startTransition(() => {
      router.refresh();
    });
  }

  async function uploadOne(item: FileItem) {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: "uploading", progress: 10 } : i)),
    );

    const form = new FormData();
    form.set("file", item.file);
    form.set("relativePath", item.relativePath);

    try {
      const res = await fetch(`/api/deals/${dealId}/documents`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const message =
          (typeof json === "object" && json !== null && "message" in json
            ? String((json as { message?: unknown }).message)
            : null) ?? `HTTP ${res.status}`;
        throw new Error(message);
      }
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "done", progress: 100 } : i)),
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: "error", error: (err as Error).message, progress: 0 }
            : i,
        ),
      );
    }
  }

  function clearCompleted() {
    setItems((prev) => prev.filter((i) => i.status !== "done"));
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return;
          setIsDragging(false);
        }}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false);

          const items = Array.from(e.dataTransfer.items ?? []);
          const entries = items
            .map((it) => ("webkitGetAsEntry" in it ? it.webkitGetAsEntry() : null))
            .filter((entry): entry is FileSystemEntry => entry !== null);

          if (entries.length > 0) {
            await handleEntries(entries);
          } else {
            handleFiles(Array.from(e.dataTransfer.files));
          }
        }}
        className={cn(
          "relative rounded-[20px] border-2 border-dashed p-8 transition-all",
          isDragging
            ? "border-warm bg-warm/5"
            : "border-foreground/[0.12] bg-foreground/[0.015] hover:border-foreground/20",
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-full",
              isDragging ? "bg-warm/15 text-warm" : "bg-foreground/[0.05] text-foreground/55",
            )}
          >
            <CloudUpload strokeWidth={1.6} className="size-5" />
          </span>
          <div>
            <p className="font-serif text-[18px] tracking-tight">Drop your data room here</p>
            <p className="text-foreground/55 mt-0.5 text-[12px]">
              Drag a folder, or click below. PDF, Excel, Word, PPT, images. Max 25 MB per file.
              Auto-categorized by folder name.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className={cn(
                "bg-foreground inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5",
                "text-background text-[12px] font-medium hover:opacity-90",
              )}
            >
              <FolderUp strokeWidth={1.8} className="size-3.5" />
              Choose folder
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full",
                "border-foreground/[0.10] border px-3.5 py-1.5",
                "text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground text-[12px]",
              )}
            >
              Choose files
            </button>
          </div>
          <input
            ref={folderInputRef}
            type="file"
            hidden
            // @ts-expect-error non-standard but supported by Chromium / WebKit
            webkitdirectory=""
            directory=""
            multiple
            onChange={(e) => {
              if (e.target.files) handleFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            onChange={(e) => {
              if (e.target.files) handleFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {items.length > 0 && (
        <div
          className={cn(
            "border-foreground/[0.08] flex flex-col gap-2 rounded-[16px] border",
            "bg-surface/40 p-3",
          )}
        >
          <div className="flex items-center justify-between px-1 text-[11px]">
            <span className="text-foreground/55">
              {done}/{total} uploaded
              {failed > 0 && <span className="text-sev-crit ml-2">{failed} failed</span>}
              {isPending && <span className="text-foreground/45 ml-2">refreshing…</span>}
            </span>
            {!inFlight && (
              <button
                type="button"
                onClick={clearCompleted}
                className="text-foreground/55 hover:text-foreground"
              >
                Clear completed
              </button>
            )}
          </div>
          <ul className="flex max-h-[260px] flex-col gap-1 overflow-y-auto">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] px-2.5 py-1.5",
                  "hover:bg-foreground/[0.02] text-[12px]",
                )}
              >
                <StatusIcon status={item.status} />
                <span className="text-foreground/85 min-w-0 flex-1 truncate">
                  {item.relativePath}
                </span>
                <span className="tabular text-foreground/45 shrink-0 text-[10.5px]">
                  {formatBytes(item.file.size)}
                </span>
                {item.status === "error" && (
                  <span
                    className="text-sev-crit max-w-[160px] shrink-0 truncate text-[10.5px]"
                    title={item.error}
                  >
                    {item.error}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: FileItem["status"] }) {
  if (status === "done") {
    return (
      <span className="bg-sev-low/15 text-sev-low flex size-4 shrink-0 items-center justify-center rounded-full">
        <Check strokeWidth={2.4} className="size-2.5" />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="bg-sev-crit/15 text-sev-crit flex size-4 shrink-0 items-center justify-center rounded-full">
        <X strokeWidth={2.4} className="size-2.5" />
      </span>
    );
  }
  if (status === "uploading") {
    return (
      <span className="text-foreground/55 flex size-4 shrink-0 items-center justify-center">
        <Loader2 strokeWidth={2} className="size-3 animate-spin" />
      </span>
    );
  }
  return (
    <span className="text-foreground/30 flex size-4 shrink-0 items-center justify-center">
      <AlertTriangle strokeWidth={1.8} className="size-2.5" />
    </span>
  );
}

async function walkEntry(
  entry: FileSystemEntry,
  prefix: string,
  out: { file: File; relativePath: string }[],
): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) =>
      (entry as FileSystemFileEntry).file(resolve, reject),
    );
    out.push({ file, relativePath: prefix ? `${prefix}/${entry.name}` : entry.name });
    return;
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const childPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
    let batch: FileSystemEntry[];
    do {
      batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      for (const child of batch) {
        await walkEntry(child, childPrefix, out);
      }
    } while (batch.length > 0);
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
