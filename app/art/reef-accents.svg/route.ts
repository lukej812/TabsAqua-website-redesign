import { reefResponse } from "@/lib/art/reef-svg";

/** Prerendered at build time: one layer of the reef, as an image. See lib/art/reef-svg.ts. */
export function GET() {
  return reefResponse("accents");
}
