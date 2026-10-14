"use client";

import { useEffect, useRef } from "react";
import { CloseIcon, PlayIcon } from "../icons";

type Props = {
  title: string;
  playLabel: string;
  closeLabel: string;
  /** Short muted loop for the card. */
  previewSrc: string;
  mp4?: string;
  webm?: string;
  poster?: string;
};

/** Plays a muted video only when motion is welcome and data isn't scarce. */
function motionAndDataOk(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return window.matchMedia("(prefers-reduced-motion: no-preference)").matches && !connection?.saveData;
}

/**
 * The hero's media card once guided descent footage exists: a muted looping
 * preview, and a play button that opens the full clip in a lightbox. The
 * lightbox is a modal <dialog>, so focus stays inside it, Escape closes it,
 * and focus returns to the play button.
 */
export function VideoCard({ title, playLabel, closeLabel, previewSrc, mp4, webm, poster }: Props) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fullRef = useRef<HTMLVideoElement>(null);
  const playRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // The preview loads nothing until idle, plays only while visible.
  useEffect(() => {
    const video = previewRef.current;
    if (!video || !motionAndDataOk() || window.matchMedia("(max-width: 767px)").matches) return;
    let visible = false;
    let ready = false;
    const update = () => {
      if (ready && visible && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(video);
    document.addEventListener("visibilitychange", update);
    const start = () => {
      ready = true;
      update();
    };
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle ? window.requestIdleCallback(start, { timeout: 3000 }) : window.setTimeout(start, 1500);
    return () => {
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      video.pause();
    };
  }, []);

  const open = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    closeRef.current?.focus();
    fullRef.current?.play().catch(() => {});
  };

  const close = () => dialogRef.current?.close();

  const onClose = () => {
    fullRef.current?.pause();
    playRef.current?.focus();
  };

  return (
    <div className="media-card glass glass-blur">
      <video
        ref={previewRef}
        className="media-card__video"
        muted
        loop
        playsInline
        preload="none"
        poster={poster}
        aria-hidden="true"
        tabIndex={-1}
        disablePictureInPicture
      >
        <source src={previewSrc} type="video/mp4" />
      </video>
      <div className="media-card__shade" aria-hidden="true" />
      <p className="media-card__text">
        <span className="media-card__title">{title}</span>
      </p>
      <button
        ref={playRef}
        type="button"
        className="icon-btn media-card__play glass-blur"
        aria-label={playLabel}
        aria-haspopup="dialog"
        data-action="lightbox-open"
        onClick={open}
      >
        <PlayIcon size={20} />
      </button>

      <dialog ref={dialogRef} className="lightbox" aria-label={title} onClose={onClose}>
        <video ref={fullRef} className="lightbox__video" controls playsInline preload="none" poster={poster}>
          {mp4 && <source src={mp4} type="video/mp4" />}
          {webm && <source src={webm} type="video/webm" />}
        </video>
        <div className="lightbox__bar">
          <p className="label">{title}</p>
          <button
            ref={closeRef}
            type="button"
            className="icon-btn"
            aria-label={closeLabel}
            data-action="lightbox-close"
            onClick={close}
          >
            <CloseIcon size={20} />
          </button>
        </div>
      </dialog>
    </div>
  );
}
