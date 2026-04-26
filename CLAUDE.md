# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Athena** — AI Due Diligence Copilot for lower-mid-market private equity. Hackathon project (HEC × Polytechnique). The current codebase is the marketing/landing site; the product copy and the `data/fictive-vdr-structure.md` sample data room hint at the broader product direction (ingest a VDR → produce sourced red flags, management questions, and a draft IC memo).

## Tech stack

- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript 5** (strict)
- **Tailwind CSS v4** via `@tailwindcss/postcss` (no `tailwind.config.*`; configuration lives in `src/app/globals.css`)
- **pnpm 10** (declared in `packageManager`) on **Node 24** (declared in `engines.node` and pinned in CI)

## Commands

```bash
pnpm dev              # Next dev server (Turbopack)
pnpm build            # Production build
pnpm start            # Run the production build

pnpm lint             # ESLint (flat config)
pnpm lint:fix         # ESLint with --fix
pnpm format           # Prettier write
pnpm format:check     # Prettier check (CI parity)
pnpm typecheck        # tsc --noEmit
```

There is no test runner wired up yet. If you add one, also add a CI job — current `.github/workflows/ci.yml` only runs lint/format/typecheck → build + sonar.

## Architecture

The `src/` tree is split into a **Next.js entrypoint layer** and a **presentation layer**, and the naming hints at room for additional layers (domain / infrastructure) as the product grows beyond the landing page:

- `src/app/` — App Router files only (`layout.tsx`, `page.tsx`, `globals.css`). Keep these thin: import from `presentation/`.
- `src/presentation/components/landing/` — landing page sections. `LandingPage.tsx` composes them in order; `mockups/` contains the in-page UI mockups (Cockpit, IC Memo).
- `src/presentation/content/landing.content.ts` — **all user-facing copy lives here**, not inline in components. When changing wording, edit this file rather than the JSX.
- `src/presentation/lib/cn.ts` — class-name helper used across components.

### Path alias gotcha

`tsconfig.json` maps `@/*` to the **repo root** (`"@/*": ["./*"]`), not to `src/`. Imports inside `src/` should use relative paths between presentation files; reserve `@/` for cross-tree references.

### Fonts and theming

Three Google fonts (Inter, PT Serif, Urbanist) are loaded in `src/app/layout.tsx` and exposed as CSS variables (`--font-inter`, `--font-pt-serif`, `--font-urbanist`). Tailwind tokens (`bg-background`, `text-foreground`) come from `globals.css`.

## CI / Release

- **CI** (`.github/workflows/ci.yml`) runs on push/PR to `main`: `lint`, `format`, `typecheck` in parallel, then `build` and `sonarcloud` after they pass. Node 24, pinned action SHAs, concurrency cancels in-flight runs on the same ref.
- **Release** (`.github/workflows/release.yml`) uses **release-please** (config: `release-please-config.json`, manifest: `.release-please-manifest.json`) on push to `main`, then maintains floating `vMAJOR` and `vMAJOR.MINOR` tags. Commit messages should follow Conventional Commits so release-please can compute the next version.
- **SonarCloud** project: `NerionSoft_hec-polytechnique-hackathon` (org `nerionsoft`). Requires `SONAR_TOKEN` repo secret. `sonar.sources=src`.

## Local hooks

`husky` is installed via `pnpm install`'s `prepare` script. The `.husky/pre-commit` hook runs `lint-staged` (ESLint --fix + Prettier on staged files). Pair changes to lint or format rules with a manual `pnpm format` so commits don't get rewritten unexpectedly.
