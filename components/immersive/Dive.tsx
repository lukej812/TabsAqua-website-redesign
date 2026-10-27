import { existsSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { descent } from "@/content/site";
import { Diver } from "../art/Diver";
import { SurfaceArt } from "../art/SurfaceArt";
import { OceanStage, type DescentMedia } from "./OceanStage";

/**
 * Test builds set this so the footage paths count as present; Playwright then
 * serves synthetic fixtures at those paths. Never set it for a real deploy.
 */
const TEST_ASSETS = process.env.GUIDED_DESCENT_TEST_ASSETS === "1";

/** Whether a file exists in public/ at build time. */
function present(publicPath: string): boolean {
  if (TEST_ASSETS) return true;
  return existsSync(path.join(process.cwd(), "public", publicPath));
}

/** Matches --deep in app/globals.css: the top of the reef section. */
const END_COLOR = "#0a3656";

/**
 * The surface and the descent: the hero and the first-dive steps, scrolling
 * over one ocean stage. Works out at build time which footage exists, so a
 * visitor never downloads a file that isn't there. Without footage, the live
 * water scene runs. Drop footage into public/ and rebuild to switch it on.
 */
export function Dive({ children }: { children: ReactNode }) {
  const { assets } = descent;
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

  return (
    <div className="dive" id="dive" data-anim>
      <OceanStage
        media={media}
        useFrames={framesFlag && framesAvailable}
        footageNote={descent.footageNote}
        endColor={END_COLOR}
        art={<SurfaceArt />}
        diver={<Diver className="diver" />}
        allowRendererOverride={TEST_ASSETS}
      />
      <div className="dive__content">{children}</div>
    </div>
  );
}
