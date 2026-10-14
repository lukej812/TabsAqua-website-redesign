import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  projects: [
    {
      // Everything, in the installed Google Chrome. Run `npx playwright install chromium`
      // and remove `channel` to use Playwright's own build instead.
      name: "chrome",
      use: { channel: "chrome" },
    },
    {
      // Most visitors are on iPhones: the layout, menu, carousel, form, and book bar
      // tests (tagged @webkit) run again in WebKit at 375 x 812.
      // Needs `npx playwright install webkit`.
      name: "webkit",
      use: { ...devices["iPhone 13 Mini"] },
      grep: /@webkit/,
      testIgnore: /guided-descent/,
    },
  ],
  webServer: {
    // Builds and starts two production servers: 3100 as the site ships, and
    // 3101 with the guided descent media treated as present (tests serve
    // synthetic fixtures there) and a test form endpoint (tests mock it).
    // Builds go to .next-test*, so dev keeps working.
    command: "node scripts/test-servers.mjs",
    url: "http://localhost:3101",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
