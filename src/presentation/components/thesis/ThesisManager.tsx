"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { NAF_DIVISIONS, NAF_SECTIONS } from "@/src/application/reference/naf";
import { COUNTRIES } from "@/src/application/reference/countries";

export interface ThesisDto {
  id: string;
  ownerId: string;
  name: string;
  sectors: string[];
  countries: string[];
  minRevenueEur: number | null;
  maxRevenueEur: number | null;
  preferences: {
    founderOwned?: boolean;
    recurringRevenue?: boolean;
    profitable?: boolean;
    fragmentedMarket?: boolean;
    successionRisk?: boolean;
    lowCompetition?: boolean;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DraftState {
  id: string | null;
  name: string;
  sectors: string[];
  countries: string[];
  minRevenueEur: string;
  maxRevenueEur: string;
  preferences: ThesisDto["preferences"];
}

const PREFERENCES: Array<{ key: keyof ThesisDto["preferences"]; label: string; help: string }> = [
  {
    key: "founderOwned",
    label: "Founder-owned",
    help: "Reward leads with an identified founder. Drives Rule 3 (+15).",
  },
  {
    key: "recurringRevenue",
    label: "Recurring revenue",
    help: "Reward leads whose narrative mentions SaaS, MRR, ARR, contracts. Rule 4 (+10).",
  },
  {
    key: "profitable",
    label: "Profitable / mature",
    help: "Reward leads with EBITDA-positive / cash-flow positive signals. Rule 5 (+10).",
  },
  {
    key: "fragmentedMarket",
    label: "Fragmented market",
    help: "Reward consolidation / buy-and-build narratives. Rule 6 (+10).",
  },
  {
    key: "successionRisk",
    label: "Succession risk",
    help: "Reward founder-dependency / transmission narratives. Rule 7 (+10).",
  },
  {
    key: "lowCompetition",
    label: "Low competition",
    help: "Reward niche / defensible-moat narratives. Rule 8 (+10).",
  },
];

function emptyDraft(): DraftState {
  return {
    id: null,
    name: "",
    sectors: [],
    countries: ["FR"],
    minRevenueEur: "",
    maxRevenueEur: "",
    preferences: {},
  };
}

function thesisToDraft(t: ThesisDto): DraftState {
  return {
    id: t.id,
    name: t.name,
    sectors: [...t.sectors],
    countries: [...t.countries],
    minRevenueEur: t.minRevenueEur != null ? String(t.minRevenueEur) : "",
    maxRevenueEur: t.maxRevenueEur != null ? String(t.maxRevenueEur) : "",
    preferences: { ...t.preferences },
  };
}

function parseEurInput(s: string): number | null {
  if (!s.trim()) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function ThesisManager({
  initialTheses,
  initialSelectedId,
}: {
  initialTheses: ThesisDto[];
  initialSelectedId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [theses, setTheses] = useState<ThesisDto[]>(initialTheses);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [draft, setDraft] = useState<DraftState>(
    initialTheses[0] ? thesisToDraft(initialTheses[0]) : emptyDraft(),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isNew = draft.id === null;

  const sectorsBySection = useMemo(() => {
    const map = new Map<string, (typeof NAF_DIVISIONS)[number][]>();
    for (const d of NAF_DIVISIONS) {
      const arr = map.get(d.section) ?? [];
      arr.push(d);
      map.set(d.section, arr);
    }
    return map;
  }, []);

  function selectThesisInList(t: ThesisDto) {
    setDraft(thesisToDraft(t));
    setError(null);
  }

  function startNew() {
    setDraft(emptyDraft());
    setError(null);
  }

  function toggleSector(code: string) {
    setDraft((d) => ({
      ...d,
      sectors: d.sectors.includes(code)
        ? d.sectors.filter((s) => s !== code)
        : [...d.sectors, code],
    }));
  }

  function toggleCountry(code: string) {
    setDraft((d) => ({
      ...d,
      countries: d.countries.includes(code)
        ? d.countries.filter((c) => c !== code)
        : [...d.countries, code],
    }));
  }

  function togglePreference(key: keyof ThesisDto["preferences"]) {
    setDraft((d) => ({
      ...d,
      preferences: { ...d.preferences, [key]: !d.preferences[key] },
    }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const body = {
        name: draft.name.trim(),
        sectors: draft.sectors,
        countries: draft.countries,
        minRevenueEur: parseEurInput(draft.minRevenueEur),
        maxRevenueEur: parseEurInput(draft.maxRevenueEur),
        preferences: draft.preferences,
      };
      if (!body.name) {
        setError("Name is required");
        setBusy(false);
        return;
      }
      const isCreate = isNew;
      const res = await fetch(isCreate ? "/api/theses" : `/api/theses/${draft.id}`, {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Save failed: ${text || res.statusText}`);
        setBusy(false);
        return;
      }
      const data = (await res.json()) as { thesis: ThesisDto };
      setTheses((prev) => {
        const idx = prev.findIndex((t) => t.id === data.thesis.id);
        if (idx === -1) return [...prev, data.thesis];
        const next = [...prev];
        next[idx] = data.thesis;
        return next;
      });
      setDraft(thesisToDraft(data.thesis));
      if (isCreate && theses.length === 0) {
        await selectThesis(data.thesis.id, { skipReload: true });
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (
      !confirm(
        "Archive this thesis? Existing leads keep their link but the thesis becomes inactive.",
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/theses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        setError(`Delete failed: ${text || res.statusText}`);
        return;
      }
      setTheses((prev) => prev.map((t) => (t.id === id ? { ...t, active: false } : t)));
      if (draft.id === id) startNew();
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  async function selectThesis(id: string, opts: { skipReload?: boolean } = {}) {
    const res = await fetch("/api/theses/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thesisId: id }),
    });
    if (!res.ok) return;
    setSelectedId(id);
    if (!opts.skipReload) startTransition(() => router.refresh());
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="flex flex-col gap-2">
        <button
          type="button"
          onClick={startNew}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-[10px]",
            "border-foreground/20 border border-dashed px-3 py-2",
            "text-foreground/65 text-[12.5px] transition-colors",
            "hover:border-foreground/40 hover:text-foreground",
          )}
        >
          <Plus strokeWidth={1.6} className="size-3.5" />
          New thesis
        </button>
        {theses.map((t) => {
          const editing = t.id === draft.id;
          const current = t.id === selectedId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => selectThesisInList(t)}
              className={cn(
                "flex flex-col gap-0.5 rounded-[12px] border px-3 py-2 text-left",
                "transition-colors",
                editing
                  ? "border-foreground/25 bg-foreground/[0.05]"
                  : "border-foreground/[0.08] bg-foreground/[0.02] hover:bg-foreground/[0.04]",
                !t.active && "opacity-50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground truncate text-[13px] font-medium">{t.name}</span>
                {current && (
                  <span
                    className={cn(
                      "bg-foreground/10 rounded-full px-1.5 py-0.5",
                      "text-foreground/70 text-[9.5px] tracking-[0.12em] uppercase",
                    )}
                  >
                    Active
                  </span>
                )}
              </div>
              <span className="text-foreground/55 text-[11px]">
                {t.sectors.length} sector{t.sectors.length === 1 ? "" : "s"} · {t.countries.length}{" "}
                countr{t.countries.length === 1 ? "y" : "ies"}
              </span>
            </button>
          );
        })}
      </aside>

      <div
        className={cn(
          "border-foreground/[0.08] flex flex-col gap-5 rounded-[18px] border",
          "bg-surface/60 p-5",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Thesis name (e.g. Athena Fund III — French B2B SaaS)"
            className={cn(
              "border-foreground/[0.08] flex-1 rounded-[10px] border bg-transparent px-3 py-2",
              "text-foreground placeholder:text-foreground/35 text-[14px]",
              "focus:border-foreground/30 focus:outline-none",
            )}
          />
          {!isNew && (
            <>
              {selectedId !== draft.id && (
                <button
                  type="button"
                  onClick={() => draft.id && selectThesis(draft.id)}
                  disabled={busy || pending}
                  className={cn(
                    "border-foreground/[0.10] rounded-full border px-3 py-1.5",
                    "text-foreground/70 hover:bg-foreground/[0.06] text-[12px]",
                  )}
                >
                  Set active
                </button>
              )}
              <button
                type="button"
                onClick={() => draft.id && remove(draft.id)}
                disabled={busy || pending}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1.5",
                  "text-foreground/55 hover:text-warm text-[12px]",
                )}
              >
                <Trash2 strokeWidth={1.6} className="size-3.5" />
                Archive
              </button>
            </>
          )}
        </div>

        <Section
          title="Sectors (NAF rév. 2 divisions)"
          description="Match is a prefix check: NAF division 62 fits any company whose code starts with 62 (e.g. 6201Z, 6202A)."
        >
          <div className="flex flex-col gap-3">
            {NAF_SECTIONS.map((section) => {
              const divs = sectorsBySection.get(section.code) ?? [];
              if (divs.length === 0) return null;
              return (
                <div key={section.code} className="flex flex-col gap-1.5">
                  <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">
                    {section.code} — {section.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {divs.map((d) => {
                      const active = draft.sectors.includes(d.code);
                      return (
                        <button
                          type="button"
                          key={d.code}
                          onClick={() => toggleSector(d.code)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11.5px] transition-colors",
                            active
                              ? "border-foreground/25 bg-foreground/10 text-foreground"
                              : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/65 hover:text-foreground",
                          )}
                        >
                          <span className="tabular text-foreground/45 text-[10.5px]">{d.code}</span>{" "}
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          title="Geography (ISO-3166-1 alpha-2)"
          description="Countries outside the thesis stay searchable but score 0 on Rule 0 (cross-border review flagged)."
        >
          <div className="flex flex-wrap gap-1.5">
            {COUNTRIES.map((c) => {
              const active = draft.countries.includes(c.code);
              return (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => toggleCountry(c.code)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1",
                    "text-[11.5px] transition-colors",
                    active
                      ? "border-foreground/25 bg-foreground/10 text-foreground"
                      : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/65 hover:text-foreground",
                  )}
                >
                  <span className="tabular text-foreground/45 text-[10.5px]">{c.code}</span>
                  <span>{c.label}</span>
                  {active && <Check strokeWidth={2} className="text-foreground/70 size-3" />}
                </button>
              );
            })}
          </div>
        </Section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Section title="Revenue range (€)" description="Inclusive bounds. Rule 2 (+15)." compact>
            <div className="flex items-center gap-2">
              <NumberField
                label="Min"
                value={draft.minRevenueEur}
                onChange={(v) => setDraft((d) => ({ ...d, minRevenueEur: v }))}
              />
              <span className="text-foreground/35">—</span>
              <NumberField
                label="Max"
                value={draft.maxRevenueEur}
                onChange={(v) => setDraft((d) => ({ ...d, maxRevenueEur: v }))}
              />
            </div>
          </Section>

          <Section
            title="Preferences"
            description="Each preference activates a corresponding scoring rule."
            compact
          >
            <div className="flex flex-col gap-1.5">
              {PREFERENCES.map((p) => (
                <label
                  key={p.key}
                  className={cn(
                    "flex items-start gap-2 rounded-[8px] px-1.5 py-1",
                    "hover:bg-foreground/[0.03] cursor-pointer transition-colors",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={!!draft.preferences[p.key]}
                    onChange={() => togglePreference(p.key)}
                    className="accent-foreground mt-0.5 size-3.5"
                  />
                  <div className="flex flex-col">
                    <span className="text-foreground text-[12.5px]">{p.label}</span>
                    <span className="text-foreground/55 text-[11px] leading-tight">{p.help}</span>
                  </div>
                </label>
              ))}
            </div>
          </Section>
        </div>

        {error && (
          <p className="border-warm/30 bg-warm/10 text-warm rounded-[10px] border px-3 py-2 text-[12.5px]">
            {error}
          </p>
        )}

        <div className="border-foreground/[0.06] flex items-center justify-end gap-2 border-t pt-4">
          <button
            type="button"
            onClick={save}
            disabled={busy || pending}
            className={cn(
              "bg-foreground rounded-full px-4 py-2 text-[12.5px] font-medium",
              "text-background transition-opacity hover:opacity-90 disabled:opacity-50",
            )}
          >
            {busy || pending ? "Saving…" : isNew ? "Create thesis" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  compact = false,
  children,
}: {
  title: string;
  description?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col gap-3", compact && "gap-2")}>
      <div>
        <h2 className="text-foreground text-[13.5px] font-medium">{title}</h2>
        {description && <p className="text-foreground/55 mt-0.5 text-[11.5px]">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className={cn(
        "border-foreground/[0.08] flex flex-1 flex-col gap-0.5 rounded-[10px] border",
        "bg-foreground/[0.02] px-3 py-2",
      )}
    >
      <p className="text-foreground/45 text-[10.5px] tracking-[0.14em] uppercase">{label}</p>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className={cn(
          "tabular text-foreground bg-transparent text-[14px] font-medium",
          "placeholder:text-foreground/35 focus:outline-none",
        )}
      />
    </div>
  );
}
