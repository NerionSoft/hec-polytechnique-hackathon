"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";

interface Props {
  selectedThesisId: string | null;
}

export function CsvImportPanel({ selectedThesisId }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    setResult(null);
    setFilename(file.name);
    try {
      const fd = new FormData();
      fd.set("file", file);
      if (selectedThesisId) fd.set("thesisId", selectedThesisId);
      const res = await fetch("/api/leads/import", { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text();
        setError(`Import failed: ${text || res.statusText}`);
        return;
      }
      const data = (await res.json()) as { imported: number; skipped: number };
      setResult({ imported: data.imported, skipped: data.skipped });
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section
      className={cn(
        "border-foreground/[0.08] flex flex-col gap-3 rounded-[18px] border",
        "bg-surface/60 p-5",
      )}
    >
      <header>
        <h3 className="text-[14px] font-medium">CSV import — Vercel Blob</h3>
        <p className="text-foreground/55 mt-0.5 text-[11.5px]">
          Auto-detects comma / semicolon. Recognised columns: companyName, website, country, sector,
          employeeCount, estimatedRevenueEur, founderName.
        </p>
      </header>

      <label
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px]",
          "border-foreground/15 bg-foreground/[0.02] border border-dashed p-6",
          "hover:bg-foreground/[0.04] text-center transition-colors",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
        {busy ? (
          <Loader2 strokeWidth={1.6} className="text-foreground/65 size-5 animate-spin" />
        ) : (
          <FileSpreadsheet strokeWidth={1.4} className="text-foreground/65 size-5" />
        )}
        <p className="text-foreground/75 text-[12.5px]">
          {busy
            ? `Uploading ${filename}…`
            : filename
              ? `Replace ${filename}`
              : "Click to choose a CSV file"}
        </p>
      </label>

      {result && (
        <p className="border-foreground/[0.10] bg-foreground/[0.04] text-foreground/80 rounded-[10px] border px-3 py-2 text-[12.5px]">
          Imported {result.imported} · skipped {result.skipped} (duplicates / parse errors).
          {pending && " Refreshing list…"}
        </p>
      )}
      {error && (
        <p className="border-warm/30 bg-warm/10 text-warm rounded-[10px] border px-3 py-2 text-[12.5px]">
          {error}
        </p>
      )}
    </section>
  );
}
