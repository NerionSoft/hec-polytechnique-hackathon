# Athena — AI Deal Workflow Agent

AI Due Diligence Copilot for lower-mid-market private equity (HEC × Polytechnique hackathon).

## Stack

Next.js 16 · React 19 · TypeScript 5 strict · Tailwind v4 · Prisma 6 + Neon Postgres · Better Auth · Vercel AI Gateway (Gemini 3 Flash) · Vercel Blob · pnpm 10 · Node 24.

Hexagonal layout: `src/application/` (use cases + ports + domain), `src/infrastructure/` (Prisma, AI SDK, scraper, blob, auth), `src/app/` (Next.js routes), `src/presentation/` (UI). ESLint enforces import boundaries.

See `CLAUDE.md` for architecture details.

## Quickstart

```bash
# 1. Install
pnpm install

# 2. Configure env (copy + fill in)
cp .env.example .env.local
# Required: DATABASE_URL, BETTER_AUTH_SECRET, AI_GATEWAY_API_KEY, BLOB_READ_WRITE_TOKEN

# 3. Apply DB migrations to Neon
pnpm db:migrate

# 4. Seed a demo user + theses
pnpm db:seed

# 5. Run
pnpm dev
```

## Demo credentials (after `pnpm db:seed`)

| Field    | Value               |
| -------- | ------------------- |
| Email    | `demo@athena-pe.io` |
| Password | `DemoAthena2026!`   |
| Name     | Demo PE SME Fund    |

The seed creates two fund theses for this user:

1. **Lower-mid B2B SaaS — France** (€5M–€50M, founder-owned, recurring revenue, profitable, niche)
2. **Buy-and-build — Industrial services DACH+FR** (€8M–€80M, fragmented market, succession risk)

Sign in via `POST /api/auth/sign-in/email` or the temporary `/admin` UI.

## Common commands

```bash
pnpm dev               # Next dev server
pnpm build             # Production build
pnpm typecheck         # tsc --noEmit
pnpm lint              # ESLint
pnpm format            # Prettier write
pnpm test              # Vitest (unit + integration)
pnpm test:unit         # tests/unit/**/*.test.ts
pnpm test:integration  # tests/integration/**/*.integration.test.ts

pnpm db:generate       # Regenerate Prisma client
pnpm db:migrate        # prisma migrate dev (uses .env.local)
pnpm db:push           # prisma db push (no migration file, fast for hackathon iterations)
pnpm db:seed           # Run prisma/seed.ts
pnpm db:studio         # Prisma Studio
```

## API surface

Auth-gated routes require a Better Auth session cookie set via `/api/auth/sign-in/email`.

| Method                 | Route                      | Purpose                                                 |
| ---------------------- | -------------------------- | ------------------------------------------------------- |
| `POST`                 | `/api/auth/sign-up/email`  | Create user (email + password)                          |
| `POST`                 | `/api/auth/sign-in/email`  | Sign in, returns session cookie                         |
| `GET` `POST`           | `/api/theses`              | List / create fund thesis                               |
| `GET` `PATCH` `DELETE` | `/api/theses/[id]`         | Get / update / soft-delete                              |
| `GET`                  | `/api/leads`               | List leads (filter: status, thesisId, pagination)       |
| `GET`                  | `/api/leads/[id]`          | Lead detail                                             |
| `POST`                 | `/api/leads/source/sirene` | Source from `recherche-entreprises.api.gouv.fr`         |
| `POST`                 | `/api/leads/import`        | Multipart CSV upload → Vercel Blob + import             |
| `POST`                 | `/api/leads/[id]/enrich`   | Scrape + Gemini enrichment (idempotent via prompt hash) |
| `POST`                 | `/api/leads/[id]/score`    | Deterministic PE-thesis scoring                         |

## License

Hackathon project — not for production use.
