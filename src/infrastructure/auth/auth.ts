import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/src/infrastructure/persistence/prisma/client";

// We read env vars directly here (not via loadEnv) so that Next.js can
// statically import this module during build/page-data collection without
// throwing on missing values. At runtime, the secret MUST be set — if it's
// the placeholder, Better Auth will refuse real sign-ins.
const SECRET =
  process.env.BETTER_AUTH_SECRET ?? "REPLACE_ME_BUILD_PLACEHOLDER_NEVER_USE_IN_PROD_xxxxxxxxxxxx";

// Resolve baseURL in this order:
//   1. BETTER_AUTH_URL (explicit override)
//   2. VERCEL_URL (auto-set on Vercel deploys, no protocol)
//   3. http://localhost:${PORT} for local dev
function resolveBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
const BASE_URL = resolveBaseUrl();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: SECRET,
  baseURL: BASE_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
