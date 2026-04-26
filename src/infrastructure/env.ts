import { z } from "zod";

const envSchema = z.object({
  // Core
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // DB
  DATABASE_URL: z.string().url().optional(),
  // Better Auth (validation done at request time, not build)
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  // AI Gateway
  AI_GATEWAY_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("google/gemini-3-flash"),
  // Vercel Blob
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ");
    throw new Error(`Invalid environment variables:\n  ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
