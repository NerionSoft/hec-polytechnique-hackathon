"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/src/presentation/lib/cn";
import { NAF_DIVISIONS, NAF_SECTIONS, isValidNafDivision } from "@/src/application/reference/naf";
import { EFFECTIF_BRACKETS } from "@/src/application/reference/effectif";
import { DEPARTEMENTS } from "@/src/application/reference/departements";
import { LEGAL_FORMS } from "@/src/application/reference/legalForm";

interface Props {
  selectedThesisId: string | null;
  defaultSectors: string[];
}

export function SireneFetchPanel({ selectedThesisId, defaultSectors }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  // Drop legacy free-text sectors (e.g. "Industrial Services") — only canonical NAF divisions.
  const initialSectors = defaultSectors.filter((s) => isValidNafDivision(s));
  const [sectors, setSectors] = useState<string[]>(initialSectors);
  const [departements, setDepartements] = useState<string[]>([]);
  const [effectifCodes, setEffectifCodes] = useState<string[]>(["12", "21", "22"]);
  // Default PE bundle: SARL (incl. EURL), SAS (incl. SASU), SA. SASU has no
  // separate INSEE code — it's a 5710. Same for EURL = 5499.
  const [legalFormCodes, setLegalFormCodes] = useState<string[]>(["5499", "5710", "5599", "5699"]);
  const [perPage, setPerPage] = useState(25);
  const [pages, setPages] = useState(1);
  const [result, setResult] = useState<{ fetched: number; imported: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  async function run() {
    if (!selectedThesisId) {
      setError("Pick an active thesis first.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      // The Sirene API doesn't accept NAF division codes ("62") for activite_principale —
      // only full subclass codes ("62.01Z") or section letters via section_activite_principale.
      // We translate picked divisions to their unique section letters and send them as `sections`.
      const sectionLetters = Array.from(
        new Set(
          sectors
            .map((d) => NAF_DIVISIONS.find((x) => x.code === d)?.section)
            .filter((s): s is string => Boolean(s)),
        ),
      );
      const body = {
        thesisId: selectedThesisId,
        pages,
        query: {
          sections: sectionLetters.length > 0 ? sectionLetters : undefined,
          departements: departements.length > 0 ? departements : undefined,
          employeeBracketCodes: effectifCodes.length > 0 ? effectifCodes : undefined,
          legalFormCodes: legalFormCodes.length > 0 ? legalFormCodes : undefined,
          perPage,
        },
      };
      const res = await fetch("/api/leads/source/sirene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(`Sirene fetch failed: ${text || res.statusText}`);
        return;
      }
      const data = (await res.json()) as { fetched: number; imported: number };
      setResult(data);
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={cn(
        "border-foreground/[0.08] flex flex-col gap-4 rounded-[18px] border",
        "bg-surface/60 p-5",
      )}
    >
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-medium">Sirene — recherche-entreprises.api.gouv.fr</h3>
          <p className="text-foreground/55 mt-0.5 text-[11.5px]">
            Real INSEE registry. Free, ~7 req/s. Imports up to {perPage} companies per call.
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy || !selectedThesisId}
          className={cn(
            "bg-foreground inline-flex items-center gap-1.5 rounded-full px-4 py-2",
            "text-background text-[12.5px] font-medium hover:opacity-90 disabled:opacity-40",
          )}
        >
          {busy ? (
            <Loader2 strokeWidth={1.6} className="size-3.5 animate-spin" />
          ) : (
            <Search strokeWidth={1.6} className="size-3.5" />
          )}
          Fetch leads
        </button>
      </header>

      <Picker
        title="NAF rév. 2 division"
        sub="Filters on activite_principale. Empty = all sectors."
      >
        <div className="flex flex-col gap-2">
          {NAF_SECTIONS.map((section) => {
            const divs = NAF_DIVISIONS.filter((d) => d.section === section.code);
            if (divs.length === 0) return null;
            return (
              <details key={section.code} className="group">
                <summary
                  className={cn(
                    "cursor-pointer list-none rounded-[8px] px-2 py-1 text-[11.5px]",
                    "text-foreground/65 hover:text-foreground",
                  )}
                >
                  ▸ {section.code} — {section.label}
                </summary>
                <div className="mt-1.5 flex flex-wrap gap-1.5 pl-3">
                  {divs.map((d) => {
                    const active = sectors.includes(d.code);
                    return (
                      <button
                        type="button"
                        key={d.code}
                        onClick={() => setSectors((s) => toggle(s, d.code))}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[11px]",
                          active
                            ? "border-foreground/25 bg-foreground/10 text-foreground"
                            : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/65",
                        )}
                      >
                        <span className="tabular text-foreground/45 text-[10px]">{d.code}</span>{" "}
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </Picker>

      <Picker
        title="Département"
        sub="Sirene's `departement` filter — INSEE codes (01–95, 2A/2B, 971–976). Empty = all France."
      >
        <div className="flex flex-wrap gap-1">
          {DEPARTEMENTS.map((d) => {
            const active = departements.includes(d.code);
            return (
              <button
                type="button"
                key={d.code}
                onClick={() => setDepartements((s) => toggle(s, d.code))}
                className={cn(
                  "tabular rounded-full border px-2 py-0.5 text-[10.5px]",
                  active
                    ? "border-foreground/25 bg-foreground/10 text-foreground"
                    : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/55",
                )}
                title={d.label}
              >
                {d.code}
              </button>
            );
          })}
        </div>
      </Picker>

      <Picker
        title="Tranche d'effectif (INSEE)"
        sub="Single companies are filtered at the establishment level."
      >
        <div className="flex flex-wrap gap-1.5">
          {EFFECTIF_BRACKETS.map((b) => {
            const active = effectifCodes.includes(b.code);
            return (
              <button
                type="button"
                key={b.code}
                onClick={() => setEffectifCodes((s) => toggle(s, b.code))}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px]",
                  active
                    ? "border-foreground/25 bg-foreground/10 text-foreground"
                    : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/65",
                )}
              >
                <span className="tabular text-foreground/45 text-[10.5px]">{b.code}</span> {b.label}
              </button>
            );
          })}
        </div>
      </Picker>

      <Picker
        title="Forme juridique (INSEE)"
        sub="Restrict to commercial companies typically targeted by PE."
      >
        <div className="flex flex-wrap gap-1.5">
          {LEGAL_FORMS.map((f) => {
            const active = legalFormCodes.includes(f.code);
            return (
              <button
                type="button"
                key={f.code}
                onClick={() => setLegalFormCodes((s) => toggle(s, f.code))}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px]",
                  active
                    ? "border-foreground/25 bg-foreground/10 text-foreground"
                    : "border-foreground/[0.08] bg-foreground/[0.02] text-foreground/65",
                )}
              >
                <span className="tabular text-foreground/45 text-[10.5px]">{f.code}</span> {f.label}
              </button>
            );
          })}
        </div>
      </Picker>

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-foreground/55 flex items-center gap-2 text-[11.5px]">
          Per page
          <input
            type="number"
            min={1}
            max={25}
            value={perPage}
            onChange={(e) => setPerPage(Math.max(1, Math.min(25, Number(e.target.value) || 25)))}
            className={cn(
              "border-foreground/[0.08] w-20 rounded-[8px] border bg-transparent px-2 py-1",
              "tabular text-foreground text-[12.5px] focus:outline-none",
            )}
          />
        </label>
        <label className="text-foreground/55 flex items-center gap-2 text-[11.5px]">
          Pages
          <input
            type="number"
            min={1}
            max={10}
            value={pages}
            onChange={(e) => setPages(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
            className={cn(
              "border-foreground/[0.08] w-16 rounded-[8px] border bg-transparent px-2 py-1",
              "tabular text-foreground text-[12.5px] focus:outline-none",
            )}
          />
        </label>
        <span className="text-foreground/45 text-[10.5px]">
          API caps each page at 25 (documented hard limit). Loop up to 10 pages = ≤ 250 leads per
          fetch.
        </span>
      </div>

      {result && (
        <p className="border-foreground/[0.10] bg-foreground/[0.04] text-foreground/80 rounded-[10px] border px-3 py-2 text-[12.5px]">
          Fetched {result.fetched} record{result.fetched === 1 ? "" : "s"} · imported{" "}
          {result.imported} (rest skipped as duplicates).
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

function Picker({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <p className="text-foreground text-[11.5px] font-medium">{title}</p>
        <p className="text-foreground/55 text-[10.5px]">{sub}</p>
      </div>
      <div className="border-foreground/[0.06] bg-foreground/[0.01] max-h-[180px] overflow-y-auto rounded-[10px] border p-2">
        {children}
      </div>
    </div>
  );
}
