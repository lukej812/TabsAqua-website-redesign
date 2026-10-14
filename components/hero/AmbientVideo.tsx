"use client";

import { useEffect, useRef } from "react";

type Props = { mp4: string; webm?: string; poster?: string; className?: string };

/**
 * A decorative looping background video (the hero's, once one exists). It
 * shows its poster first and plays only while visible, with motion allowed
 * and data saver off.
 */
export function AmbientVideo({ mp4, webm, poster, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (!video || connection?.saveData) return;
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let visible = true;
    const update = () => {
      if (visible && motion.matches && !document.hidden) video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(video);
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
    >
      {webm && <source src={webm} type="video/webm" />}
      <source src={mp4} type="video/mp4" />
    </video>
  );
}
