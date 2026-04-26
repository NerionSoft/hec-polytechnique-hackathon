import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
        resolve: {
          alias: { "@": resolve(__dirname, ".") },
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.integration.test.ts"],
          environment: "node",
          testTimeout: 30_000,
          hookTimeout: 30_000,
          pool: "forks",
        },
        resolve: {
          alias: { "@": resolve(__dirname, ".") },
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/application/**", "src/infrastructure/**"],
      exclude: [
        "src/app/**",
        "src/presentation/**",
        "tests/**",
        "**/*.test.ts",
        "**/*.integration.test.ts",
        "**/*.d.ts",
        "**/index.ts",
        "**/*.config.*",
      ],
    },
  },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});
