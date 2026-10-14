/**
 * Pure mapping from one normalized scroll progress value (0 to 1) to everything
 * the guided descent shows: video time, chapter visibility, and depth tint.
 * One progress value drives all of it, so nothing can drift out of sync.
 */

export type ChapterRange = readonly [start: number, end: number];

/** How much progress a chapter spends fading in or out at each edge. */
export const CHAPTER_FADE = 0.045;

/** How far a chapter travels while it fades, as a fraction of its own height. */
export const CHAPTER_TRAVEL = 0.12;

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** A gentle ease-out. Text settles; it never bounces. */
function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Index of the chapter that owns this progress value. */
export function chapterIndexAt(progress: number, ranges: readonly ChapterRange[]): number {
  const p = clamp01(progress);
  for (let i = ranges.length - 1; i >= 0; i--) {
    if (p >= ranges[i][0]) return i;
  }
  return 0;
}

export type ChapterState = {
  /** 0 to 1 */
  opacity: number;
  /** -1 to 1, multiplied by CHAPTER_TRAVEL for the vertical offset. Positive is below rest. */
  offset: number;
};

/**
 * Visibility of chapter `index` at `progress`.
 * Each chapter fades in at the start of its range and out at the end, so one
 * chapter is fully gone before the next is fully in. The first chapter is
 * already visible at 0 and the last one stays visible at 1.
 */
export function chapterState(progress: number, index: number, ranges: readonly ChapterRange[]): ChapterState {
  const p = clamp01(progress);
  const [start, end] = ranges[index];
  const first = index === 0;
  const last = index === ranges.length - 1;

  if (p < start || p > end) {
    return { opacity: 0, offset: p < start ? 1 : -1 };
  }
  if (!first && p < start + CHAPTER_FADE) {
    const t = easeOut((p - start) / CHAPTER_FADE);
    return { opacity: t, offset: 1 - t };
  }
  if (!last && p > end - CHAPTER_FADE) {
    const t = easeOut((end - p) / CHAPTER_FADE);
    return { opacity: t, offset: -(1 - t) };
  }
  return { opacity: 1, offset: 0 };
}

/**
 * Video time for a progress value. Stops one frame short of the end so the
 * video never reaches its "ended" state while scrubbing.
 */
export function videoTimeAt(progress: number, duration: number, fps = 30): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  const last = Math.max(0, duration - 1 / fps);
  return clamp01(progress) * last;
}

/** Frame index for a progress value in an image sequence. */
export function frameIndexAt(progress: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  return Math.round(clamp01(progress) * (frameCount - 1));
}

/** Progress at the middle of a chapter, used to bring a focused chapter into view. */
export function chapterMidpoint(index: number, ranges: readonly ChapterRange[]): number {
  const [start, end] = ranges[index];
  return (start + end) / 2;
}
