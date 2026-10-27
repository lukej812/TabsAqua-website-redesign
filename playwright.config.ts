import { defineConfig } from "@playwright/test";

const PORT = 3100;

/**
 * Uses the installed Google Chrome by default. To use another Chromium build
 * (a CI image, a sandbox), set PW_CHROMIUM_PATH to its executable instead.
 */
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...(executablePath ? {} : { channel: "chrome" }),
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      // Software WebGL, so the live water scene renders the same in headless runs.
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  webServer: {
    // Builds and starts two production servers: 3100 as the site ships, and
    // 3101 with the descent footage treated as present (tests serve
    // synthetic fixtures there). Builds go to .next-test*, so dev keeps working.
    command: "node scripts/test-servers.mjs",
    url: "http://localhost:3101",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
