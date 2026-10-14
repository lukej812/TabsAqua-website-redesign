import { existsSync } from "node:fs";
import path from "node:path";
import { guidedDescent } from "@/content/site";
import { GuidedDescent, type DescentMedia } from "./GuidedDescent";

/**
 * Test builds set this so the media paths count as present; Playwright then
 * serves synthetic fixtures at those paths. Never set it for a real deploy.
 */
const TEST_ASSETS = process.env.GUIDED_DESCENT_TEST_ASSETS === "1";

/** Whether a file exists in public/ at build time. */
function present(publicPath: string): boolean {
  if (TEST_ASSETS) return true;
  return existsSync(path.join(process.cwd(), "public", publicPath));
}

/**
 * Server half of the guided descent. Works out which media files exist when
 * the site is built, so a visitor never downloads a file that isn't there.
 * Drop the files into public/ and rebuild to switch the footage on.
 */
export function GuidedDescentSection() {
  const { assets } = guidedDescent;
  const framesFlag = process.env.NEXT_PUBLIC_USE_FRAME_SEQUENCE === "true";
  const framesAvailable = (framesFlag || TEST_ASSETS) && present(assets.framesManifest);

  const media: DescentMedia = {
    webm: present(assets.webm) ? assets.webm : undefined,
    mp4: present(assets.mp4) ? assets.mp4 : undefined,
    mobileMp4: present(assets.mobileMp4) ? assets.mobileMp4 : undefined,
    poster: present(assets.poster) ? assets.poster : undefined,
    mobilePoster: present(assets.mobilePoster) ? assets.mobilePoster : undefined,
    framesManifest: framesAvailable ? assets.framesManifest : undefined,
  };

  // The four files the brief requires. The mobile cut and frames are optional.
  const missing = [assets.webm, assets.mp4, assets.poster, assets.mobilePoster].filter((p) => !present(p));

  return (
    <GuidedDescent
      title={guidedDescent.title}
      chapters={guidedDescent.chapters}
      cta={guidedDescent.cta}
      secondary={guidedDescent.secondary}
      footageNote={guidedDescent.footageNote}
      media={media}
      useFrames={framesFlag && framesAvailable}
      missing={missing}
      showDevWarning={process.env.NODE_ENV === "development"}
      allowRendererOverride={TEST_ASSETS}
    />
  );
}
