"use client";

import { useEffect, useRef } from "react";

interface LazyVideoProps {
  src: string;
  poster?: string;
  controls?: boolean;
}

// A muted, looping video that downloads nothing until it scrolls into view,
// plays while it is on screen and pauses when it leaves. A collection page
// used to autoplay every work at once — Ainimations alone is sixteen clips
// and 473 MB, all streaming from the first paint.
export default function LazyVideoComponent({
  src,
  poster,
  controls,
}: LazyVideoProps) {
  const videoReference = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoReference.current;
    if (!video) return;
    // With controls the viewer can start it; without, it has to play itself.
    const reducedMotion =
      controls && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [controls]);

  return (
    <video
      ref={videoReference}
      muted
      loop
      playsInline
      preload="none"
      controls={controls}
      poster={poster}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}
