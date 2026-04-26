# Feature Coverage Map (for the demo / pitch)

For each feature, the agent(s) responsible, the destination Prisma table(s), the % automated, and what remains for the human analyst.

## Coverage table

| Feature                        | Agent(s)                                 | Persists to                                                                  | % auto | Reste à faire           |
| ------------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------- | -----: | ----------------------- |
| Upload documents               | Étage 0                                  | `Document`                                                                   |   100% | —                       |
| Auto-catégorisation docs       | A1                                       | `Document.category`, `peTaxonomy`, `routedTo`                                |    95% | UI override             |
| Analyse IA (red flags)         | A3, A6, A7, A9                           | `Finding`                                                                    |   ~85% | Forensic + counsel      |
| Citations sources              | All + S3                                 | `Citation`, `Citation.verified`                                              |    99% | Last-mile manual        |
| Severity scoring               | All findings agents                      | `Finding.severity` (enum)                                                    |   100% | —                       |
| Questions management           | A3, A4, A5, A6, A7, A8, A9 + S2          | `ManagementQuestion`                                                         |    90% | Analyst personalization |
| IC memo (5 sections)           | S2 + S3                                  | `Memo`, `MemoSection`                                                        |   100% | Analyst sign-off        |
| Rapport exportable             | S2                                       | `Memo.pdfBlobUrl` (separate render)                                          |   100% | PDF styling             |
| Comparaison multi-docs         | A1 routing + agents (conflicts surfaced) | `evidence.conflict` flag                                                     |    80% | Diff UI                 |
| Deal thesis                    | S1                                       | `Deal.thesisFit`, `DealAuditEvent`                                           |   100% | Analyst validation      |
| Financial snapshot             | A2                                       | `FinancialSnapshot.trendJson`, `kpiJson`, `workingCapitalJson` + `Deal` KPIs |   100% | —                       |
| EBITDA bridge                  | A4                                       | `FinancialSnapshot.bridgeJson`                                               |    70% | Judgment add-backs      |
| Customer concentration         | A5                                       | `FinancialSnapshot.concentrationJson`, `retentionJson`                       |    95% | Reference calls         |
| Debt / covenants               | A6                                       | `Finding`, `Deal.netDebtEbitda`                                              |    85% | Lender confirmations    |
| QoE red flags                  | A3                                       | `Finding` (FINANCIAL)                                                        |    90% | Forensic                |
| Commercial DD                  | A8                                       | `ManagementQuestion` (COMMERCIAL)                                            |    60% | Expert calls            |
| Legal red flags                | A7                                       | `Finding` (LEGAL)                                                            |    80% | Counsel review          |
| Management & governance        | A9                                       | `Finding` (OPERATIONAL/ESG)                                                  |    75% | References              |
| Deal kanban (revenue, ebitda…) | A2 → Deal cache                          | `Deal.revenueEur`, `ebitdaEur`, `growthYoy`, …                               |   100% | —                       |
| Audit timeline                 | Orchestrator + every step                | `DealAuditEvent`                                                             |   100% | —                       |

## Pitch — gain quantifié

> Une analyste PE met aujourd'hui **5–10 jours** sur un VDR de cette taille (966 docs).
> Athena livre le pack complet (memo IC + 9 dossiers spécialistes + Q&A management + citations vérifiées) en **~10–12 minutes wall-clock** grâce à la parallélisation, avec un taux de citation vérifiée **> 99%**.
> **Gain ≈ 95% du temps analyste**, à qualité supérieure (zéro citation fabriquée garantie par S3).

## Démo — script à montrer

1. **Upload** → 966 PDFs glissés dans le workspace (5 s).
2. **Phase 0 + A1** progress bar : "Triage 966/966 — 42 s" (40 s wall).
3. **Phase 1** dashboard : 8 agents en parallèle avec spinners individuels et tokens/sec (~3 min).
4. **Phase 2** : génération du memo en streaming Markdown (~2 min).
5. **Phase 3 (S3)** : "Vérification de 187 citations… 187/187 ✅" — _le moment pitch_.
6. **Memo final** ouvert : un clic sur n'importe quelle citation `[c1]` ouvre le PDF source (PDF.js) ancré au §.

## Argument différenciateur

| Concurrent (résumeur générique) | Athena                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Résume les docs                 | Produit une **note de décision PE**                                                                                                |
| Cite "le document X"            | Cite `§n.m` avec quote verbatim, vérifié S3                                                                                        |
| Hallucine 1–5% des chiffres     | **0% hallucination** garantie par S3 (gate bloquant) + JSON schema enforced server-side par Gemini                                 |
| 1 agent généraliste             | 12 agents spécialisés, parallèles                                                                                                  |
| Output prose                    | Output **JSON typé + Markdown** persisté en Postgres, queryable, auditable                                                         |
| LLM unique                      | Mix `gemini-3-flash` (extraction structurée) + `gemini-3-pro thinking` (raisonnement QoE/legal/synthèse) → ~$1 par run de 966 docs |

## Mapping front pages → données

| Page                        | Lit depuis                                    | Mis à jour par                                         |
| --------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `/pipeline` (kanban)        | `Deal` (joined `Lead`)                        | A2 (KPIs), S1 (thesisFit), normalizers (redFlagsCount) |
| `/pipeline/[id]/overview`   | `Deal`, `Finding` (top), `ManagementQuestion` | All                                                    |
| `/pipeline/[id]/financials` | `FinancialSnapshot`                           | A2, A4, A5                                             |
| `/pipeline/[id]/risks`      | `Finding` (filtered)                          | A3, A6, A7, A9                                         |
| `/pipeline/[id]/questions`  | `ManagementQuestion`                          | All findings agents + A8 + S2                          |
| `/pipeline/[id]/memo`       | `Memo` + 5×`MemoSection`                      | S2 + S3                                                |
| `/pipeline/[id]/data-room`  | `Document` (with citations count)             | Phase 0 + A1                                           |
| `/pipeline/[id]/audit`      | `DealAuditEvent`                              | Orchestrator + every normalizer                        |
| `CitationDrawer` (anywhere) | `Citation` join `Document` join `Chunk`       | All agents                                             |
