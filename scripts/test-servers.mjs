/**
 * Starts the two production builds the Playwright suite needs, one after the
 * other so the builds never write the same files at once:
 *   - port 3100: the site as it ships today (no guided descent media)
 *   - port 3101: a build that treats the media as present
 *     (GUIDED_DESCENT_TEST_ASSETS=1). Tests serve synthetic fixtures at the
 *     media paths, so this build never contains real or fake footage.
 * Stops both servers when Playwright stops this script.
 */
import { spawn, spawnSync } from "node:child_process";

const builds = [
  { port: 3100, distDir: ".next-test", env: {} },
  { port: 3101, distDir: ".next-test-media", env: { GUIDED_DESCENT_TEST_ASSETS: "1" } },
];

for (const build of builds) {
  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    env: { ...process.env, ...build.env, NEXT_DIST_DIR: build.distDir },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const servers = builds.map((build) =>
  spawn("npx", ["next", "start", "--port", String(build.port)], {
    stdio: "inherit",
    env: { ...process.env, ...build.env, NEXT_DIST_DIR: build.distDir },
  }),
);

const stop = () => {
  for (const server of servers) server.kill("SIGTERM");
  process.exit(0);
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
for (const server of servers) server.on("exit", (code) => code && stop());
