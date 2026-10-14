import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Build-time checks for files in public/. Server components use these so a
 * visitor never downloads a file that isn't there: drop a file in and rebuild
 * to switch its slot on.
 */

/**
 * Test builds set this so the guided descent media paths count as present;
 * Playwright then serves synthetic fixtures at those paths. Never set it for
 * a real deploy.
 */
export const GUIDED_DESCENT_TEST_ASSETS = process.env.GUIDED_DESCENT_TEST_ASSETS === "1";

/** Whether a file exists in public/ at build time. */
export function publicFileExists(publicPath: string): boolean {
  return existsSync(path.join(process.cwd(), "public", publicPath));
}

/** Guided descent media: present on disk, or treated as present in test builds. */
export function descentMediaPresent(publicPath: string): boolean {
  return GUIDED_DESCENT_TEST_ASSETS || publicFileExists(publicPath);
}
