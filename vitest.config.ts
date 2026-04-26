import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/application/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "integration",
          include: ["src/infrastructure/**/*.integration.test.ts"],
          environment: "node",
          testTimeout: 30_000,
          hookTimeout: 30_000,
          pool: "forks",
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
        "**/*.test.ts",
        "**/*.integration.test.ts",
        "**/*.d.ts",
        "**/index.ts",
        "**/*.config.*",
      ],
    },
  },
});
