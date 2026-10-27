/**
 * Pure mapping from scroll position to everything the ocean stage shows:
 * footage time, frame index, how far the camera has sunk, and the hand-off
 * to the next section. One scroll value drives all of it, so nothing can
 * drift out of sync.
 */

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export type StageMetrics = {
  /** Pixels scrolled past the top of the dive wrapper. Can be negative or past the end. */
  scrolled: number;
  /** Wrapper height, in pixels. */
  height: number;
  /** Stage (viewport) height, in pixels. */
  viewport: number;
};

export type StageState = {
  /** 0 at the top of the wrapper, 1 when the stage is about to scroll away. */
  progress: number;
  /** How far the camera has sunk, in screen heights. Never negative. */
  depth: number;
  /** 0 to 1 over the last screen of pinned travel: blend into the next section's color. */
  end: number;
};

export function stageState({ scrolled, height, viewport }: StageMetrics): StageState {
  const travel = Math.max(1, height - viewport);
  const clamped = Math.min(Math.max(scrolled, 0), travel);
  return {
    progress: clamped / travel,
    depth: clamped / Math.max(1, viewport),
    end: smoothstep(travel - viewport, travel, clamped),
  };
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

/**
 * Moves `current` toward `target` like a weighted camera: fast at first, then
 * settling. `lag` is roughly how long it takes to catch up, in seconds.
 */
export function follow(current: number, target: number, dt: number, lag = 0.14): number {
  if (lag <= 0) return target;
  const next = current + (target - current) * (1 - Math.exp(-dt / lag));
  return Math.abs(target - next) < 1e-4 ? target : next;
}

export type DiverPose = {
  /** Offset from the diver's resting place, as fractions of the screen. */
  x: number;
  y: number;
  rotate: number;
  scale: number;
  opacity: number;
};

/**
 * Where the diver is for a given depth. On wide screens the diver sinks
 * slowly beside the text and leaves the frame at the end of the descent. On
 * phones the text is full width, so the diver fades away as the hero leaves.
 */
export function diverPose(state: StageState, small: boolean): DiverPose {
  const d = Math.min(state.depth, 3);
  if (small) {
    return {
      x: d * 0.04,
      y: d * 0.1,
      rotate: 4 + d * 4,
      scale: 1 - d * 0.1,
      opacity: 1 - smoothstep(0.12, 0.45, state.depth),
    };
  }
  const exit = smoothstep(0.82, 1, state.progress);
  return {
    x: d * 0.025,
    y: d * 0.045 + exit * exit * 0.7,
    rotate: 2 + d * 3 + exit * 8,
    scale: 1 - d * 0.07,
    opacity: 1,
  };
}
