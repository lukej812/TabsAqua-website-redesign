import { defineConfig } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Uses the installed Google Chrome. Run `npx playwright install chromium`
    // and remove this line to use Playwright's own build instead.
    channel: "chrome",
  },
  webServer: {
    // Builds and starts two production servers: 3100 as the site ships, and
    // 3101 with the guided descent media treated as present (tests serve
    // synthetic fixtures there). Builds go to .next-test*, so dev keeps working.
    command: "node scripts/test-servers.mjs",
    url: "http://localhost:3101",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
