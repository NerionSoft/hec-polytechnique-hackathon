import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,

  // Hexagonal boundary: application/ stays framework-agnostic.
  {
    files: ["src/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/src/infrastructure/*", "**/infrastructure/*"],
              message:
                "application/ must not import from infrastructure/. Depend on a port instead.",
            },
            {
              group: ["@/src/app/*", "**/app/*"],
              message: "application/ must not import from app/.",
            },
            {
              group: ["@/src/presentation/*", "**/presentation/*"],
              message: "application/ must not import from presentation/.",
            },
            {
              group: [
                "@prisma/client",
                "ai",
                "cheerio",
                "robots-parser",
                "csv-parse",
                "csv-parse/sync",
                "@vercel/blob",
                "better-auth",
                "better-auth/*",
                "next",
                "next/*",
              ],
              message:
                "application/ is framework-agnostic. Move this dependency behind a port and implement it in infrastructure/.",
            },
          ],
        },
      ],
    },
  },

  // App router business routes can only touch the composition root + auth helper.
  // Mirrors the application/** SDK list (minus next, which routes legitimately need
  // for NextRequest/NextResponse).
  {
    files: ["src/app/api/leads/**/route.ts", "src/app/api/theses/**/route.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@prisma/client",
                "ai",
                "cheerio",
                "robots-parser",
                "csv-parse",
                "csv-parse/sync",
                "@vercel/blob",
                "better-auth",
                "better-auth/*",
              ],
              message:
                "API routes must not touch SDKs directly. Call a use case via getUseCases() and use requireSession from infrastructure/auth/server.",
            },
          ],
        },
      ],
    },
  },

  // Infrastructure must not depend on UI/route layers.
  {
    files: ["src/infrastructure/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/src/app/*", "**/app/*"],
              message: "infrastructure/ must not import from app/.",
            },
            {
              group: ["@/src/presentation/*", "**/presentation/*"],
              message: "infrastructure/ must not import from presentation/.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.integration.test.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
]);

export default eslintConfig;
