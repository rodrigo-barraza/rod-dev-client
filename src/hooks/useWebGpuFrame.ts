"use client";

import { useEffect, useRef, useState } from "react";
import type { WebGpuFrame, WebGpuSession } from "@/types/types";

export interface UseWebGpuFrameOptions {
  /** Pause without unmounting. */
  enabled?: boolean;
  /** Keep running while the tab is hidden. Off by default — the browser
   * throttles rAF to a crawl there anyway, and a simulation stepping on
   * those stretched frames drifts away from what the user last saw. */
  runWhenHidden?: boolean;
  /** Ceiling on `deltaTime`, in milliseconds. The first frame back from a
   * background tab is otherwise seconds long, and a physics step handed
   * that number tunnels straight through the world. */
  maxDeltaTime?: number;
  /** Frames per second reported through `fps`, at most once per second. */
  onStats?: (fps: number) => void;
}

export interface UseWebGpuFrameResult {
  isRunning: boolean;
  /** Rounded, refreshed about once a second — cheap enough to render. */
  fps: number;
  frameCount: number;
}

const DEFAULT_MAX_DELTA_TIME = 100;

/**
 * Drives a render callback off `requestAnimationFrame` for the life of a
 * session.
 *
 * Nothing is submitted unless `render` is given: no callback, no loop, no
 * work — which is the state the site ships in today. When a renderer does
 * arrive, this is where it hooks up, and it can count on the session it is
 * handed staying valid for every frame of that generation.
 */
export default function useWebGpuFrame(
  session: WebGpuSession | null,
  render?: (frame: WebGpuFrame) => void,
  options: UseWebGpuFrameOptions = {},
): UseWebGpuFrameResult {
  const {
    enabled = true,
    runWhenHidden = false,
    maxDeltaTime = DEFAULT_MAX_DELTA_TIME,
  } = options;

  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  // Tracked as state rather than read from `document` during render so the
  // loop restarts on the change; set from the event, never from an effect.
  const [isHidden, setIsHidden] = useState(false);

  // The callback is read through a ref so that an inline arrow — the way
  // every caller will write it — does not restart the loop each render.
  // Written in an effect: a ref mutated during render is torn between
  // React's passes.
  const renderRef = useRef(render);
  const statsRef = useRef(options.onStats);
  useEffect(() => {
    renderRef.current = render;
    statsRef.current = options.onStats;
  });

  // Presence, not identity: swapping one callback for another is picked up
  // through the ref above, but going from none to one has to start the loop.
  const hasRenderer = Boolean(render);

  // Derived, so nothing has to be set synchronously inside the effect.
  const isRunning =
    Boolean(session && enabled && render) && (runWhenHidden || !isHidden);

  useEffect(() => {
    if (!session || !enabled || !render) return;

    let handle = 0;
    let cancelled = false;
    // An explicit flag, not `startTime === 0`: the first timestamp rAF hands
    // out is a page-relative one that legitimately can be 0, and treating
    // that as "not started" restarts the clock on the second frame — which
    // is a deltaTime of zero handed to whatever is integrating with it.
    let started = false;
    let startTime = 0;
    let previousTime = 0;
    let frame = 0;
    let framesThisSecond = 0;
    let secondMark = 0;

    const step = (now: number) => {
      if (cancelled) return;

      if (!started) {
        started = true;
        startTime = now;
        previousTime = now;
        secondMark = now;
      }

      const deltaTime = Math.min(now - previousTime, maxDeltaTime);
      previousTime = now;
      frame += 1;
      framesThisSecond += 1;

      const { canvas } = session;
      renderRef.current?.({
        session,
        time: now - startTime,
        deltaTime,
        frame,
        width: canvas.width,
        height: canvas.height,
      });

      if (now - secondMark >= 1000) {
        const measured = Math.round(
          (framesThisSecond * 1000) / (now - secondMark),
        );
        framesThisSecond = 0;
        secondMark = now;
        setFps(measured);
        setFrameCount(frame);
        statsRef.current?.(measured);
      }

      handle = requestAnimationFrame(step);
    };

    const onVisibilityChange = () => setIsHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // The clock starts here rather than carrying across a pause: `time` is
    // meant to be time spent animating, not wall-clock since mount.
    if (runWhenHidden || !document.hidden) {
      handle = requestAnimationFrame(step);
    }

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (handle) cancelAnimationFrame(handle);
      handle = 0;
    };
    // `render` itself is deliberately absent: it is read through the ref, and
    // `hasRenderer` is what actually starts or stops the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, enabled, runWhenHidden, maxDeltaTime, isHidden, hasRenderer]);

  return { isRunning, fps, frameCount };
}
