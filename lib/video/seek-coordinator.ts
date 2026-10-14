/**
 * Coordinates scroll-driven seeking on one media element.
 *
 * Setting currentTime starts an asynchronous seek. Assigning it on every
 * scroll frame makes browsers queue or abandon seeks unpredictably, which shows
 * up as stutter and lag during fast scrolling. This coordinator allows exactly
 * one seek in flight and remembers only the latest requested time behind it.
 * Intermediate requests are dropped, so fast scrolling can never build a backlog.
 *
 * A seek is released when the browser has presented its frame
 * (requestVideoFrameCallback), or one animation frame after "seeked" where
 * that API is missing. Timeouts guard against events that never arrive, for
 * example a seek to the frame already on screen.
 */

export type SeekableMedia = EventTarget & {
  currentTime: number;
  requestVideoFrameCallback?: (callback: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export type SeekStats = {
  requested: number;
  started: number;
  completed: number;
  /** Requests replaced by a newer one before they ever started. */
  superseded: number;
  /** Requests skipped because the media was already at that time. */
  skipped: number;
  /** Never more than 1. */
  maxInFlight: number;
  /** Never more than 1. */
  maxQueued: number;
};

export type SeekCoordinatorOptions = {
  /** Requests closer than this to the current time are skipped, in seconds. */
  epsilon?: number;
  /** Give up waiting for "seeked" after this long, in ms. */
  seekTimeoutMs?: number;
  /** Give up waiting for the frame to be presented after this long, in ms. */
  frameTimeoutMs?: number;
  /** Fallback when requestVideoFrameCallback is missing. Defaults to requestAnimationFrame. */
  nextFrame?: (callback: () => void) => unknown;
  /** Called whenever a seek starts or finishes, for instrumentation. */
  onChange?: (stats: Readonly<SeekStats>) => void;
};

export class SeekCoordinator {
  private readonly media: SeekableMedia;
  private readonly epsilon: number;
  private readonly seekTimeoutMs: number;
  private readonly frameTimeoutMs: number;
  private readonly nextFrame: (callback: () => void) => unknown;
  private readonly onChange?: (stats: Readonly<SeekStats>) => void;

  private inFlight: number | null = null;
  private queued: number | null = null;
  private frameHandle: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  readonly stats: SeekStats = {
    requested: 0,
    started: 0,
    completed: 0,
    superseded: 0,
    skipped: 0,
    maxInFlight: 0,
    maxQueued: 0,
  };

  constructor(media: SeekableMedia, options: SeekCoordinatorOptions = {}) {
    this.media = media;
    this.epsilon = options.epsilon ?? 1 / 120;
    this.seekTimeoutMs = options.seekTimeoutMs ?? 600;
    this.frameTimeoutMs = options.frameTimeoutMs ?? 120;
    this.onChange = options.onChange;
    this.nextFrame =
      options.nextFrame ??
      ((callback) =>
        typeof requestAnimationFrame === "function"
          ? requestAnimationFrame(callback)
          : setTimeout(callback, 16));
    this.media.addEventListener("seeked", this.handleSeeked);
  }

  /** Ask for a time. Returns immediately; the seek happens when the media is free. */
  request(time: number): void {
    if (this.destroyed || !Number.isFinite(time)) return;
    this.stats.requested++;

    if (this.inFlight === null) {
      if (Math.abs(this.media.currentTime - time) < this.epsilon) {
        this.stats.skipped++;
        return;
      }
      this.start(time);
      return;
    }

    if (this.queued !== null) this.stats.superseded++;
    this.queued = time;
    this.stats.maxQueued = Math.max(this.stats.maxQueued, 1);
  }

  /** True while a seek is running. */
  get busy(): boolean {
    return this.inFlight !== null;
  }

  /** The time waiting behind the active seek, if any. */
  get pending(): number | null {
    return this.queued;
  }

  destroy(): void {
    this.destroyed = true;
    this.media.removeEventListener("seeked", this.handleSeeked);
    this.clearTimer();
    if (this.frameHandle !== null && this.media.cancelVideoFrameCallback) {
      this.media.cancelVideoFrameCallback(this.frameHandle);
    }
    this.frameHandle = null;
    this.inFlight = null;
    this.queued = null;
  }

  private start(time: number): void {
    this.inFlight = time;
    this.stats.started++;
    this.stats.maxInFlight = Math.max(this.stats.maxInFlight, 1);
    this.onChange?.(this.stats);
    this.armTimer(this.seekTimeoutMs);
    this.media.currentTime = time;
  }

  private handleSeeked = (): void => {
    if (this.destroyed || this.inFlight === null) return;
    this.clearTimer();
    if (typeof this.media.requestVideoFrameCallback === "function") {
      this.frameHandle = this.media.requestVideoFrameCallback(() => {
        this.frameHandle = null;
        this.release();
      });
      this.armTimer(this.frameTimeoutMs);
    } else {
      this.nextFrame(() => this.release());
    }
  };

  private release = (): void => {
    if (this.destroyed || this.inFlight === null) return;
    this.clearTimer();
    if (this.frameHandle !== null && this.media.cancelVideoFrameCallback) {
      this.media.cancelVideoFrameCallback(this.frameHandle);
      this.frameHandle = null;
    }
    this.inFlight = null;
    this.stats.completed++;
    this.onChange?.(this.stats);

    const next = this.queued;
    this.queued = null;
    if (next !== null && Math.abs(this.media.currentTime - next) >= this.epsilon) {
      this.start(next);
    }
  };

  private armTimer(ms: number): void {
    this.clearTimer();
    this.timer = setTimeout(this.release, ms);
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
