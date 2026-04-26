"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { GlassButton } from "@/src/presentation/components/landing/GlassButton";

const COUNTRIES = [
  "FR",
  "DE",
  "BE",
  "NL",
  "ES",
  "IT",
  "PT",
  "IE",
  "DK",
  "SE",
  "NO",
  "FI",
  "EE",
  "AT",
  "CH",
  "GB",
  "PL",
];

export function NewDealButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    if (busy) return;
    setOpen(false);
    setError(null);
    formRef.current?.reset();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      companyName: String(form.get("companyName") ?? "").trim(),
      country: String(form.get("country") ?? "FR"),
      sector: nonEmpty(form.get("sector")),
      website: nonEmpty(form.get("website")),
      founderName: nonEmpty(form.get("founderName")),
      estimatedRevenueEur: parseNumberMillions(form.get("estimatedRevenueMeur")),
      employeeCount: parseInteger(form.get("employeeCount")),
    };

    try {
      const res = await fetch("/api/deals/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        setError(json.message ?? `HTTP ${res.status}`);
        return;
      }
      const { dealId } = (await res.json()) as { dealId: string };
      router.push(`/pipeline/${dealId}/data-room`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <GlassButton size="sm" variant="solid" onClick={() => setOpen(true)}>
        <Plus strokeWidth={1.8} className="size-3.5" />
        New deal
      </GlassButton>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pt-[6vh] pb-6 sm:pt-[10vh]">
          <div
            aria-hidden="true"
            onClick={close}
            className="bg-foreground/40 fixed inset-0 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-deal-title"
            className={cn(
              "bg-background border-foreground/10 relative z-10 w-full max-w-[480px] rounded-[20px] border",
              "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)]",
            )}
          >
            <div className="border-foreground/[0.08] flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 id="new-deal-title" className="font-serif text-[20px] tracking-tight">
                  New deal
                </h2>
                <p className="text-foreground/55 mt-0.5 text-[12px]">
                  Manually source a target. Creates a Lead + Deal and opens the data room.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className={cn(
                  "border-foreground/[0.10] bg-foreground/[0.04] flex size-8 items-center",
                  "justify-center rounded-full border",
                  "text-foreground/55 hover:bg-foreground/[0.08] hover:text-foreground",
                )}
              >
                <X strokeWidth={1.6} className="size-4" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 px-5 py-4">
              <Field
                label="Company name"
                required
                input={
                  <input
                    ref={firstFieldRef}
                    name="companyName"
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Helios AgriTech"
                    className={inputCls}
                  />
                }
              />

              <div className="grid grid-cols-[140px_1fr] gap-3">
                <Field
                  label="Country"
                  input={
                    <select name="country" defaultValue="FR" className={inputCls}>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  }
                />
                <Field
                  label="Sector"
                  input={
                    <input
                      name="sector"
                      type="text"
                      placeholder="Agritech · Specialty Crops"
                      className={inputCls}
                    />
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Revenue (€M)"
                  input={
                    <input
                      name="estimatedRevenueMeur"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="31.0"
                      className={inputCls}
                    />
                  }
                />
                <Field
                  label="Employees"
                  input={
                    <input
                      name="employeeCount"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="142"
                      className={inputCls}
                    />
                  }
                />
              </div>

              <Field
                label="Website"
                input={
                  <input
                    name="website"
                    type="url"
                    placeholder="https://helios.example"
                    className={inputCls}
                  />
                }
              />

              <Field
                label="Founder"
                input={
                  <input
                    name="founderName"
                    type="text"
                    placeholder="Camille Laurent"
                    className={inputCls}
                  />
                }
              />

              {error && (
                <p className="border-warm/30 bg-warm/10 text-warm rounded-[8px] border px-3 py-2 text-[12px]">
                  {error}
                </p>
              )}

              <div className="border-foreground/[0.06] -mx-5 mt-2 flex items-center justify-end gap-2 border-t px-5 pt-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={busy}
                  className={cn(
                    "border-foreground/[0.10] rounded-full border px-3.5 py-1.5",
                    "text-foreground/65 hover:bg-foreground/[0.06] hover:text-foreground text-[12px]",
                    "disabled:opacity-40",
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className={cn(
                    "bg-foreground text-background inline-flex items-center gap-1.5",
                    "rounded-full px-4 py-1.5 text-[12px] font-medium hover:opacity-90",
                    "disabled:opacity-50",
                  )}
                >
                  {busy && <Loader2 strokeWidth={1.6} className="size-3.5 animate-spin" />}
                  Create deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls = cn(
  "border-foreground/[0.10] bg-foreground/[0.02] h-9 w-full rounded-[10px] border px-3",
  "text-[13px] outline-none transition-colors",
  "focus:border-foreground/30 focus:bg-foreground/[0.04]",
);

function Field({
  label,
  required,
  input,
}: {
  label: string;
  required?: boolean;
  input: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-foreground/55 text-[10.5px] tracking-[0.14em] uppercase">
        {label}
        {required && <span className="text-warm ml-1">*</span>}
      </span>
      {input}
    </label>
  );
}

function nonEmpty(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseNumberMillions(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim().length === 0) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 1_000_000);
}

function parseInteger(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim().length === 0) return null;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
