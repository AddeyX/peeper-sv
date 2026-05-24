import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:4500",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node --import tsx ./src/cli.ts --root tests/fixtures/sample-kit-project --no-open --port 4500",
    url: "http://localhost:4500",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
