"use client";
/* eslint-disable react-hooks/set-state-in-effect -- Temporary admin UI; React 19 strict effect rules
   would require lifting state to a query lib (TanStack Query, SWR). For this throwaway test
   console we accept the cascading-render warning. */

// Temporary test UI — will be replaced when the real product UI ships.
// Uses fetch + useState only. No router, no toasts, intentionally bare.

import { Fragment, useCallback, useEffect, useState } from "react";

interface Thesis {
  id: string;
  name: string;
  sectors: string[];
  countries: string[];
  minRevenueEur: number | null;
  maxRevenueEur: number | null;
  preferences: Record<string, boolean>;
  active: boolean;
}

interface EnrichmentSummary {
  businessSummary: string;
  peFitScore: number;
  peFitDecision: "REJECT" | "WATCHLIST" | "OUTREACH";
  concernsCount: number;
  rationaleCount: number;
  missingInfoCount: number;
  model: string;
  updatedAt: string;
}

interface ScoreSummary {
  score: number;
  decision: "REJECT" | "WATCHLIST" | "OUTREACH";
  thesisId: string | null;
  reasonsCount: number;
  updatedAt: string;
}

interface EnrichmentDetail extends EnrichmentSummary {
  investmentRationale: string[];
  concerns: string[];
  suggestedOutreachAngle: string;
  reasons: string[];
  missingInfo: string[];
  promptTokens: number | null;
  completionTokens: number | null;
}

interface ScoreDetail extends ScoreSummary {
  reasons: string[];
  missingInfo: string[];
}

interface Lead {
  id: string;
  source: string;
  companyName: string;
  website: string | null;
  country: string;
  sector: string | null;
  employeeCount: number | null;
  estimatedRevenueEur: number | null;
  founderName: string | null;
  status: string;
  thesisId: string | null;
  enrichment: EnrichmentSummary | null;
  score: ScoreSummary | null;
}

type SessionState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "signed-in"; user: { id: string; email: string; name: string | null } };

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await r.json().catch(() => null);
  if (!r.ok) {
    throw new Error(typeof body?.message === "string" ? body.message : `HTTP ${r.status}`);
  }
  return body as T;
}

export default function AdminPage() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  const refreshSession = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/get-session");
      if (!r.ok) {
        setSession({ status: "anon" });
        return;
      }
      const data = await r.json();
      if (data?.user) {
        setSession({ status: "signed-in", user: data.user });
      } else {
        setSession({ status: "anon" });
      }
    } catch {
      setSession({ status: "anon" });
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  return (
    <main
      style={{
        maxWidth: 980,
        margin: "32px auto",
        padding: 24,
        fontFamily: "system-ui",
        background: "#ffffff",
        color: "#111111",
        borderRadius: 12,
        boxShadow: "0 0 0 1px #e5e7eb",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>
        Athena — admin / test console
      </h1>
      <p style={{ color: "#555", marginBottom: 16 }}>
        Temporary UI. Sign in with the seeded demo user. See <code>README.md</code> for credentials.
      </p>

      <MethodologyPanel />

      {session.status === "loading" && <p>Loading session…</p>}

      {session.status === "anon" && <AuthBox onSignedIn={refreshSession} />}

      {session.status === "signed-in" && (
        <Workbench user={session.user} onSignedOut={refreshSession} />
      )}
    </main>
  );
}

// ─── Auth ────────────────────────────────────────────────────────────────────

function AuthBox({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("demo@athena-pe.io");
  const [password, setPassword] = useState("DemoAthena2026!");
  const [name, setName] = useState("Demo PE SME Fund");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const url = mode === "signin" ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email";
      const body = mode === "signin" ? { email, password } : { email, password, name };
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => null);
        throw new Error(data?.message ?? `HTTP ${r.status}`);
      }
      await onSignedIn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{
        border: "1px solid #ddd",
        padding: 16,
        borderRadius: 8,
        maxWidth: 420,
        background: "#fff",
        color: "#111",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#111" }}>
        {mode === "signin" ? "Sign in" : "Sign up"}
      </h2>
      {mode === "signup" && (
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </Field>
      )}
      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
        />
      </Field>
      {error && <p style={{ color: "#b00", fontSize: 13 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="submit" disabled={busy} style={primaryBtn}>
          {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          style={ghostBtn}
        >
          {mode === "signin" ? "Need an account?" : "Have one?"}
        </button>
      </div>
    </form>
  );
}

// ─── Workbench ───────────────────────────────────────────────────────────────

function Workbench({
  user,
  onSignedOut,
}: {
  user: { id: string; email: string; name: string | null };
  onSignedOut: () => Promise<void>;
}) {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [activeThesisId, setActiveThesisId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const append = (line: string) =>
    setLog((l) => [`${new Date().toLocaleTimeString()}  ${line}`, ...l].slice(0, 30));

  const refreshTheses = useCallback(async () => {
    const data = await jsonFetch<{ theses: Thesis[] }>("/api/theses");
    setTheses(data.theses);
    if (!activeThesisId && data.theses.length > 0) setActiveThesisId(data.theses[0].id);
  }, [activeThesisId]);

  const refreshLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (activeThesisId) params.set("thesisId", activeThesisId);
    const data = await jsonFetch<{ leads: Lead[] }>(`/api/leads?${params.toString()}`);
    setLeads(data.leads);
  }, [activeThesisId]);

  useEffect(() => {
    void refreshTheses();
  }, [refreshTheses]);

  useEffect(() => {
    void refreshLeads();
  }, [refreshLeads]);

  const signOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    await onSignedOut();
  };

  const wrap = async <T,>(name: string, fn: () => Promise<T>): Promise<T | null> => {
    setBusy(name);
    try {
      const r = await fn();
      append(`${name} ✓`);
      return r;
    } catch (e) {
      append(`${name} ✗ ${(e as Error).message}`);
      return null;
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <p style={{ fontSize: 14, color: "#444" }}>
          Signed in as <strong>{user.email}</strong> ({user.name ?? "—"})
        </p>
        <button onClick={signOut} style={ghostBtn}>
          Sign out
        </button>
      </div>

      <Section title="Fund theses">
        <ThesisManager
          theses={theses}
          activeId={activeThesisId}
          onActiveChange={setActiveThesisId}
          onCreate={async (input) => {
            await wrap("create thesis", () =>
              jsonFetch("/api/theses", { method: "POST", body: JSON.stringify(input) }),
            );
            await refreshTheses();
          }}
          onDelete={async (id) => {
            await wrap(`deactivate thesis ${id.slice(0, 6)}`, () =>
              jsonFetch(`/api/theses/${id}`, { method: "DELETE" }),
            );
            await refreshTheses();
          }}
        />
      </Section>

      <Section title="Source leads">
        <SourcePanel
          activeThesisId={activeThesisId}
          onSireneSearch={async (query) => {
            await wrap("source sirene", () =>
              jsonFetch("/api/leads/source/sirene", {
                method: "POST",
                body: JSON.stringify({ thesisId: activeThesisId ?? undefined, query }),
              }),
            );
            await refreshLeads();
          }}
          onCsvUpload={async (file) => {
            const fd = new FormData();
            fd.append("file", file);
            if (activeThesisId) fd.append("thesisId", activeThesisId);
            await wrap("csv import", async () => {
              const r = await fetch("/api/leads/import", { method: "POST", body: fd });
              if (!r.ok) {
                const b = await r.json().catch(() => null);
                throw new Error(b?.message ?? `HTTP ${r.status}`);
              }
              return r.json();
            });
            await refreshLeads();
          }}
        />
      </Section>

      <Section title={`Leads (${leads.length})`}>
        <LeadsTable
          leads={leads}
          activeThesisId={activeThesisId}
          busy={busy}
          onEnrich={async (id) => {
            await wrap(`enrich ${id.slice(0, 6)}`, () =>
              jsonFetch(`/api/leads/${id}/enrich`, { method: "POST", body: "{}" }),
            );
            await refreshLeads();
          }}
          onScore={async (id) => {
            if (!activeThesisId) {
              append("score ✗ no active thesis selected");
              return;
            }
            await wrap(`score ${id.slice(0, 6)}`, () =>
              jsonFetch(`/api/leads/${id}/score`, {
                method: "POST",
                body: JSON.stringify({ thesisId: activeThesisId }),
              }),
            );
            await refreshLeads();
          }}
        />
      </Section>

      <Section title="Activity log">
        <pre
          style={{
            background: "#f6f6f6",
            color: "#222",
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
            maxHeight: 220,
            overflow: "auto",
            border: "1px solid #e5e7eb",
          }}
        >
          {log.length === 0 ? "no activity yet" : log.join("\n")}
        </pre>
      </Section>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ThesisManager({
  theses,
  activeId,
  onActiveChange,
  onCreate,
  onDelete,
}: {
  theses: Thesis[];
  activeId: string | null;
  onActiveChange: (id: string) => void;
  onCreate: (input: {
    name: string;
    sectors: string[];
    countries: string[];
    minRevenueEur: number | null;
    maxRevenueEur: number | null;
    preferences: Record<string, boolean>;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [sectors, setSectors] = useState("Software, B2B SaaS");
  const [countries, setCountries] = useState("France");
  const [minRev, setMinRev] = useState("5000000");
  const [maxRev, setMaxRev] = useState("50000000");
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    founderOwned: true,
    recurringRevenue: true,
    profitable: true,
    fragmentedMarket: false,
    successionRisk: false,
    lowCompetition: false,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onCreate({
      name: name.trim(),
      sectors: sectors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      countries: countries
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      minRevenueEur: minRev ? Number(minRev) : null,
      maxRevenueEur: maxRev ? Number(maxRev) : null,
      preferences: prefs,
    });
    setName("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Existing</p>
        {theses.length === 0 && <p style={{ color: "#888" }}>No thesis yet.</p>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {theses.map((t) => (
            <li
              key={t.id}
              style={{
                padding: 8,
                marginBottom: 6,
                border: `1px solid ${t.id === activeId ? "#222" : "#ddd"}`,
                borderRadius: 6,
                background: t.active ? "#fff" : "#f4f4f4",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{t.name}</strong>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => onActiveChange(t.id)} style={ghostBtn}>
                    {t.id === activeId ? "active" : "select"}
                  </button>
                  <button onClick={() => onDelete(t.id)} style={ghostBtn}>
                    deactivate
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {t.sectors.join(", ") || "—"} · {t.countries.join(", ") || "—"} · €
                {(t.minRevenueEur ?? 0).toLocaleString()}–€
                {(t.maxRevenueEur ?? 0).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={submit} style={{ borderLeft: "1px solid #eee", paddingLeft: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Create new thesis</p>
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Sectors (comma-separated)">
          <input value={sectors} onChange={(e) => setSectors(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Countries (comma-separated)">
          <input
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <div style={{ display: "flex", gap: 8 }}>
          <Field label="Min € revenue">
            <input value={minRev} onChange={(e) => setMinRev(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Max € revenue">
            <input value={maxRev} onChange={(e) => setMaxRev(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>Preferences</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {Object.keys(prefs).map((k) => (
            <label key={k} style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={prefs[k]}
                onChange={(e) => setPrefs({ ...prefs, [k]: e.target.checked })}
              />{" "}
              {k}
            </label>
          ))}
        </div>
        <button type="submit" style={{ ...primaryBtn, marginTop: 8 }}>
          Create
        </button>
      </form>
    </div>
  );
}

function SourcePanel({
  activeThesisId,
  onSireneSearch,
  onCsvUpload,
}: {
  activeThesisId: string | null;
  onSireneSearch: (q: {
    sectors?: string[];
    employeeBracketCodes?: string[];
    page?: number;
    perPage?: number;
  }) => Promise<void>;
  onCsvUpload: (file: File) => Promise<void>;
}) {
  const [naf, setNaf] = useState("62.01Z");
  const [bracket, setBracket] = useState("12,21");
  const [perPage, setPerPage] = useState("10");
  const [file, setFile] = useState<File | null>(null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Sirene (recherche-entreprises.gouv.fr)</p>
        <Field label="NAF code(s) — comma-separated">
          <input value={naf} onChange={(e) => setNaf(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Employee bracket code(s) — INSEE tranches">
          <input value={bracket} onChange={(e) => setBracket(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Per page (max 25 — Sirene API limit)">
          <input
            type="number"
            min={1}
            max={25}
            value={perPage}
            onChange={(e) => setPerPage(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <button
          onClick={() =>
            onSireneSearch({
              sectors: naf
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              employeeBracketCodes: bracket
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              perPage: Math.min(Math.max(1, Number(perPage) || 10), 25),
              page: 1,
            })
          }
          style={primaryBtn}
        >
          Search & import
        </button>
      </div>

      <div style={{ borderLeft: "1px solid #eee", paddingLeft: 16 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>CSV import</p>
        <p style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          Columns: <code>companyName</code> (required), <code>website</code>, <code>sector</code>,{" "}
          <code>country</code>, <code>employeeCount</code>, <code>estimatedRevenue</code>,{" "}
          <code>founderName</code>. French aliases (CA, Effectif, Fondateur) supported.{" "}
          {activeThesisId
            ? "Linked to active thesis."
            : "No active thesis — leads will be unattached."}
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          disabled={!file}
          onClick={() => file && onCsvUpload(file)}
          style={{ ...primaryBtn, marginTop: 8 }}
        >
          Upload
        </button>
      </div>
    </div>
  );
}

function LeadsTable({
  leads,
  activeThesisId,
  busy,
  onEnrich,
  onScore,
}: {
  leads: Lead[];
  activeThesisId: string | null;
  busy: string | null;
  onEnrich: (id: string) => Promise<void>;
  onScore: (id: string) => Promise<void>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<
    Record<string, { enrichment: EnrichmentDetail | null; score: ScoreDetail | null }>
  >({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  if (leads.length === 0)
    return <p style={{ color: "#888" }}>No leads yet. Source from Sirene or upload a CSV.</p>;

  const toggleExpand = async (lead: Lead) => {
    if (expandedId === lead.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(lead.id);
    if (!details[lead.id] && (lead.enrichment || lead.score)) {
      setLoadingDetail(lead.id);
      try {
        const data = await jsonFetch<{
          enrichment: EnrichmentDetail | null;
          score: ScoreDetail | null;
        }>(`/api/leads/${lead.id}`);
        setDetails((d) => ({
          ...d,
          [lead.id]: { enrichment: data.enrichment, score: data.score },
        }));
      } catch {
        // ignore — UI shows "no detail loaded"
      } finally {
        setLoadingDetail(null);
      }
    }
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr style={{ background: "#f0f0f0" }}>
          <th style={th}></th>
          <th style={th}>Company</th>
          <th style={th}>Country</th>
          <th style={th}>Sector</th>
          <th style={th}>Emp.</th>
          <th style={th}>Rev€</th>
          <th style={th}>Status</th>
          <th style={th}>Enrichment</th>
          <th style={th}>Score</th>
          <th style={th}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {leads.map((l) => {
          const expanded = expandedId === l.id;
          const detail = details[l.id];
          const hasAnyDetail = l.enrichment !== null || l.score !== null;
          return (
            <Fragment key={l.id}>
              <tr>
                <td style={td}>
                  <button
                    onClick={() => toggleExpand(l)}
                    style={{ ...ghostBtn, padding: "2px 6px", minWidth: 22 }}
                    disabled={!hasAnyDetail}
                    title={hasAnyDetail ? "Toggle details" : "Enrich first to see details"}
                  >
                    {expanded ? "▾" : "▸"}
                  </button>
                </td>
                <td style={td}>
                  <strong>{l.companyName}</strong>
                  {l.website && (
                    <>
                      <br />
                      <a href={l.website} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                        {l.website}
                      </a>
                    </>
                  )}
                </td>
                <td style={td}>{l.country}</td>
                <td style={td}>{l.sector ?? "—"}</td>
                <td style={td}>{l.employeeCount ?? "—"}</td>
                <td style={td}>{l.estimatedRevenueEur?.toLocaleString() ?? "—"}</td>
                <td style={td}>{l.status}</td>
                <td style={td}>
                  {l.enrichment ? (
                    <DecisionPill
                      score={l.enrichment.peFitScore}
                      decision={l.enrichment.peFitDecision}
                      label="LLM"
                    />
                  ) : (
                    <span style={{ color: "#aaa" }}>—</span>
                  )}
                </td>
                <td style={td}>
                  {l.score ? (
                    <DecisionPill score={l.score.score} decision={l.score.decision} label="Rule" />
                  ) : (
                    <span style={{ color: "#aaa" }}>—</span>
                  )}
                </td>
                <td style={td}>
                  <button disabled={busy !== null} onClick={() => onEnrich(l.id)} style={ghostBtn}>
                    Enrich
                  </button>{" "}
                  <button
                    disabled={busy !== null || !activeThesisId || !l.enrichment}
                    onClick={() => onScore(l.id)}
                    style={ghostBtn}
                    title={
                      !l.enrichment
                        ? "Enrich first"
                        : !activeThesisId
                          ? "Select a thesis first"
                          : ""
                    }
                  >
                    Score
                  </button>
                </td>
              </tr>
              {expanded && (
                <tr>
                  <td colSpan={10} style={{ ...td, background: "#fafafa", padding: 12 }}>
                    {loadingDetail === l.id ? (
                      <em>Loading details…</em>
                    ) : detail ? (
                      <LeadDetail enrichment={detail.enrichment} score={detail.score} />
                    ) : (
                      <em style={{ color: "#888" }}>
                        No detail loaded yet. Enrich the lead first.
                      </em>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function DecisionPill({
  score,
  decision,
  label,
}: {
  score: number;
  decision: "REJECT" | "WATCHLIST" | "OUTREACH";
  label: string;
}) {
  const palette: Record<string, { bg: string; fg: string }> = {
    REJECT: { bg: "#fde2e2", fg: "#8b1a1a" },
    WATCHLIST: { bg: "#fff3cd", fg: "#7a5b00" },
    OUTREACH: { bg: "#d4edda", fg: "#1f5c2a" },
  };
  const colors = palette[decision];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
      <span style={{ fontWeight: 600 }}>{score}</span>
      <span
        style={{
          background: colors.bg,
          color: colors.fg,
          padding: "1px 6px",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {decision}
      </span>
      <span style={{ color: "#888", fontSize: 10 }}>{label}</span>
    </span>
  );
}

function LeadDetail({
  enrichment,
  score,
}: {
  enrichment: EnrichmentDetail | null;
  score: ScoreDetail | null;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <strong style={{ fontSize: 13 }}>LLM Enrichment</strong>
        {!enrichment && <p style={{ color: "#888", fontSize: 12 }}>Not enriched yet.</p>}
        {enrichment && (
          <div style={{ fontSize: 12, marginTop: 6 }}>
            <p style={{ marginBottom: 6 }}>{enrichment.businessSummary}</p>
            <BulletBlock title="Investment rationale" items={enrichment.investmentRationale} />
            <BulletBlock title="Concerns" items={enrichment.concerns} />
            <BulletBlock title="Outreach angle" items={[enrichment.suggestedOutreachAngle]} />
            <BulletBlock title="Reasons" items={enrichment.reasons} />
            <BulletBlock title="Missing info" items={enrichment.missingInfo} />
            <p style={{ color: "#888", fontSize: 11, marginTop: 6 }}>
              {enrichment.model} · in {enrichment.promptTokens ?? "?"} / out{" "}
              {enrichment.completionTokens ?? "?"} tokens · updated{" "}
              {new Date(enrichment.updatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
      <div>
        <strong style={{ fontSize: 13 }}>Deterministic Score</strong>
        {!score && (
          <p style={{ color: "#888", fontSize: 12 }}>Not scored yet (enrich + select thesis).</p>
        )}
        {score && (
          <div style={{ fontSize: 12, marginTop: 6 }}>
            <p>
              <strong>{score.score}/100</strong> · {score.decision}
              {score.thesisId && (
                <span style={{ color: "#888", marginLeft: 8 }}>
                  vs thesis {score.thesisId.slice(0, 8)}…
                </span>
              )}
            </p>
            <BulletBlock title="Reasons" items={score.reasons} />
            <BulletBlock title="Missing info" items={score.missingInfo} />
            <p style={{ color: "#888", fontSize: 11, marginTop: 6 }}>
              updated {new Date(score.updatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function BulletBlock({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0 || (items.length === 1 && !items[0])) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <span style={{ fontWeight: 600 }}>{title}:</span>
      <ul style={{ margin: "2px 0 0 18px", padding: 0 }}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ─── Methodology panel ──────────────────────────────────────────────────────
// Static, expandable explainer. Mirrors the actual code so it can be shown
// to PE fund users / IC reviewers to defend the screening decision.

const SCORING_RULES = [
  {
    rule: "Sector match",
    points: 20,
    fires:
      "Lead.sector (lowercased, trimmed) matches one of thesis.sectors. Case-insensitive equality.",
    skipIf: "thesis.sectors is empty (permissive thesis) — no points awarded, no penalty.",
    missingIf: "Lead.sector is unknown.",
  },
  {
    rule: "Size band",
    points: 15,
    fires:
      "Lead.estimatedRevenueEur ∈ [thesis.minRevenueEur, thesis.maxRevenueEur]. If revenue is missing, falls back to employeeCount ∈ [10, 250] (SME proxy).",
    skipIf: "Both estimatedRevenueEur AND employeeCount are unknown.",
    missingIf: "Both unknown → flagged in missingInfo.",
  },
  {
    rule: "Founder-owned",
    points: 15,
    fires: "thesis.preferences.founderOwned = true AND Lead.founderName is non-empty.",
    skipIf:
      "thesis.preferences.founderOwned is undefined or false → rule not evaluated, no penalty.",
    missingIf: "Preference is true but founderName is unknown — flagged in missingInfo.",
  },
  {
    rule: "Recurring revenue",
    points: 10,
    fires:
      "Keyword regex hit on (businessSummary + investmentRationale + concerns). Matches: SaaS, abonnement, subscription, MRR, ARR, recurring, récurrent, multi-year contract, contrat pluriannuel.",
    skipIf: "No keyword hit AND thesis.preferences.recurringRevenue is not true.",
    missingIf: "Thesis prefers recurring revenue but no keyword evidence in enrichment narrative.",
  },
  {
    rule: "Profitable / mature",
    points: 10,
    fires:
      "Keyword: profitable, rentable, EBITDA-positive, EBITDA positif, cash-flow positive, bénéficiaire, positive margins, marges positives, mature.",
    skipIf: "No keyword + preference not asked.",
    missingIf: "Preference asked but no keyword hit.",
  },
  {
    rule: "Fragmented market / buy-and-build",
    points: 10,
    fires:
      "Keyword: fragmented, fragmenté, buy-and-build, build-up, consolidation, roll-up, marché fragmenté.",
    skipIf: "No keyword + preference not asked.",
    missingIf: "Preference asked but no keyword hit.",
  },
  {
    rule: "Succession / founder-dependency",
    points: 10,
    fires:
      "Keyword: succession, fondateur-dépendant, founder dependency, key-person risk, retirement, départ à la retraite, transmission, cédant, owner exit.",
    skipIf: "No keyword + preference not asked.",
    missingIf: "Preference asked but no keyword hit.",
  },
  {
    rule: "Low competition / niche",
    points: 10,
    fires:
      "Keyword: low competition, peu de concurrence, niche, niche market, defensible moat, barriers to entry, limited competitors.",
    skipIf: "No keyword + preference not asked.",
    missingIf: "Preference asked but no keyword hit.",
  },
];

const SCORING_THRESHOLDS = [
  { decision: "REJECT", range: "score < 40", color: "#fde2e2", fg: "#8b1a1a" },
  { decision: "WATCHLIST", range: "40 ≤ score < 70", color: "#fff3cd", fg: "#7a5b00" },
  { decision: "OUTREACH", range: "score ≥ 70", color: "#d4edda", fg: "#1f5c2a" },
];

function MethodologyPanel() {
  const [open, setOpen] = useState(false);
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      style={{
        marginBottom: 24,
        border: "1px solid #d4d4d4",
        borderRadius: 8,
        background: "#fafafa",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          padding: "10px 14px",
          fontWeight: 600,
          color: "#111",
          listStyle: "none",
        }}
      >
        ▸ How it works — sources, pipeline & scoring methodology
      </summary>
      <div style={{ padding: 16, color: "#222", fontSize: 13, lineHeight: 1.55 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, color: "#111" }}>
          1. Lead sources
        </h3>
        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
          <li>
            <strong>Sirene</strong> — French government open API{" "}
            <code>recherche-entreprises.api.gouv.fr</code>. No auth, ~7 req/s. Filters: NAF code,
            postal code, INSEE employee bracket, legal form. Returns SIREN, raison sociale, NAF,
            tranche d&apos;effectif, dirigeants, headquarters address. Pagination capped at 25/page.
          </li>
          <li>
            <strong>CSV import</strong> — multipart upload. Original file stored on{" "}
            <strong>Vercel Blob</strong> (public, audit trail). Auto-detects comma vs semicolon
            (French Excel). Header aliases supported (e.g. <code>Effectif</code> →{" "}
            <code>employeeCount</code>, <code>CA</code> → <code>estimatedRevenueEur</code>,{" "}
            <code>Fondateur</code> → <code>founderName</code>).
          </li>
          <li>
            <strong>Manual</strong> — direct API insertion (not exposed in this UI yet).
          </li>
          <li>
            All leads dedupe on (<code>source</code>, <code>sourceRef</code>) — re-sourcing the same
            SIREN updates the existing row instead of creating a duplicate.
          </li>
        </ul>

        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 18, color: "#111" }}>
          2. Enrichment pipeline (per lead)
        </h3>
        <ol style={{ marginTop: 4, paddingLeft: 20 }}>
          <li>
            <strong>Website snapshot</strong> — if <code>lead.website</code> is set, the URL is
            checked against the persistent <code>WebsiteSnapshot</code> cache. On miss: fetch with
            User-Agent <code>Athena-DealProof/0.1</code>, respect <code>robots.txt</code>{" "}
            (fail-closed on disallow), 8s timeout, 1.5MB body cap. Cheerio extracts{" "}
            <code>&lt;title&gt;</code>, <code>meta[name=description]</code>, <code>h1</code>/
            <code>h2</code> headings, contact emails (regex), social links (LinkedIn / Twitter /
            Facebook / Instagram / GitHub).
          </li>
          <li>
            <strong>LLM enrichment</strong> — Lead fields + scraped snapshot are formatted into a
            user prompt and sent to <code>google/gemini-3-flash</code> via{" "}
            <strong>Vercel AI Gateway</strong>. Output is constrained by a Zod schema (structured
            JSON). System prompt instructs: source-backed only, conservative scoring, decision must
            self-align with score band. Temperature 0.2, max 2 retries. Cost guard: aborts if user
            prompt &gt; 20k chars (~5k tokens).
          </li>
          <li>
            <strong>Idempotency cache</strong> — SHA-256 hash of (system prompt + user prompt +
            model + schema version) is the primary key. A second call with identical input skips the
            LLM and returns the cached enrichment (zero token cost).
          </li>
          <li>
            <strong>Persistence</strong> — every enrichment is upserted into{" "}
            <code>lead_enrichment</code> (one row per lead, latest wins) and the lead{" "}
            <code>status</code> moves to <code>ENRICHED</code>.
          </li>
        </ol>

        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 18, color: "#111" }}>
          3. Scoring methodology — two complementary signals
        </h3>
        <p style={{ marginTop: 4 }}>
          Athena produces <strong>two scores per lead</strong>, intentionally:
        </p>
        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
          <li>
            <strong>LLM PE-fit score</strong> (in the &quot;Enrichment&quot; column) — Gemini&apos;s
            holistic 0-100 judgment. Non-deterministic, narrative-aware, but not fully auditable.
          </li>
          <li>
            <strong>Rule-based score</strong> (in the &quot;Score&quot; column) — pure deterministic
            function over the LLM output + the active fund thesis. 100% reproducible. The LLM&apos;s
            peFitScore is intentionally <em>ignored</em> by this engine — the rule-based score is an
            audit on top of the narrative, not a multiplier of it.
          </li>
        </ul>
        <p>If the two disagree, treat it as a flag for human review.</p>

        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 18, color: "#111" }}>
          4. Rule-based scoring rubric (8 rules, 100 points max)
        </h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            marginTop: 6,
            background: "#fff",
          }}
        >
          <thead>
            <tr style={{ background: "#eee" }}>
              <th style={th}>Rule</th>
              <th style={{ ...th, width: 50 }}>Pts</th>
              <th style={th}>Fires when…</th>
              <th style={th}>Skipped (no penalty) when…</th>
              <th style={th}>Logged as missingInfo when…</th>
            </tr>
          </thead>
          <tbody>
            {SCORING_RULES.map((r) => (
              <tr key={r.rule}>
                <td style={td}>
                  <strong>{r.rule}</strong>
                </td>
                <td style={{ ...td, textAlign: "center", fontWeight: 700 }}>+{r.points}</td>
                <td style={td}>{r.fires}</td>
                <td style={td}>{r.skipIf}</td>
                <td style={td}>{r.missingIf}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 18, color: "#111" }}>
          5. Decision thresholds
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          {SCORING_THRESHOLDS.map((t) => (
            <div
              key={t.decision}
              style={{
                background: t.color,
                color: t.fg,
                padding: "8px 12px",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {t.decision} — {t.range}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#555", marginTop: 8 }}>
          Threshold of 70 (not 60) for OUTREACH is intentional: the rubric maxes at 100, and 70
          requires roughly 4-5 distinct positive signals to fire. 60 would let a deal pass on sector
          + size + a single keyword — too noisy for an analyst-time decision.
        </p>

        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 18, color: "#111" }}>
          6. Special handling
        </h3>
        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
          <li>
            <strong>Country mismatch</strong> — if Lead.country is not in thesis.countries, no
            points are deducted (no negative scoring), but <code>countryOutsideThesis</code> is
            added to <code>missingInfo</code> for human review (cross-border mandate question).
          </li>
          <li>
            <strong>Score cap</strong> — defensively clamped to <code>[0, 100]</code>.
          </li>
          <li>
            <strong>Empty thesis</strong> — empty <code>sectors</code> / empty{" "}
            <code>countries</code> / no preferences = permissive thesis: rules silently skip rather
            than auto-pass or auto-fail.
          </li>
          <li>
            <strong>No re-scrape</strong> — once a website snapshot is cached, repeated enrichments
            of the same URL skip the network fetch. Force a fresh fetch via{" "}
            <code>{`{"forceRescrape": true}`}</code> in the enrich body.
          </li>
        </ul>

        <p style={{ fontSize: 12, color: "#666", marginTop: 14 }}>
          Source files: <code>src/application/use-cases/leads/scoringEngine.ts</code> (rubric),{" "}
          <code>src/infrastructure/llm/ai-gateway/AiGatewayLeadEnricher.ts</code> (LLM call),{" "}
          <code>src/infrastructure/sources/sirene/SireneCompanyDataSource.ts</code> (Sirene),{" "}
          <code>src/infrastructure/scraping/cheerio/CheerioWebsiteScraper.ts</code> (scraper).
        </p>
      </div>
    </details>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: "#111" }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 8, color: "#111" }}>
      <span style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 2 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
  background: "#ffffff",
  color: "#111111",
};
const primaryBtn: React.CSSProperties = {
  background: "#111111",
  color: "#ffffff",
  border: "1px solid #111111",
  padding: "6px 12px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
};
const ghostBtn: React.CSSProperties = {
  background: "#ffffff",
  color: "#222222",
  border: "1px solid #bbbbbb",
  padding: "4px 10px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
};
const th: React.CSSProperties = {
  textAlign: "left",
  padding: 6,
  borderBottom: "1px solid #dddddd",
  color: "#111111",
  fontWeight: 600,
};
const td: React.CSSProperties = {
  padding: 6,
  borderBottom: "1px solid #f0f0f0",
  color: "#222222",
};
