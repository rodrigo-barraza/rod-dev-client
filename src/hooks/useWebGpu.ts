"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import WebGpuLibrary from "@/libraries/WebGpuLibrary";
import type { WebGpuFailure, WebGpuSession, WebGpuStatus } from "@/types/types";

export interface UseWebGpuOptions {
  /** Set false to hold initialisation off — a canvas behind a tab, or one
   * waiting on a user gesture. Flipping it back to true initialises. */
  enabled?: boolean;
  powerPreference?: GPUPowerPreference;
  requiredFeatures?: GPUFeatureName[];
  optionalFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
  alphaMode?: GPUCanvasAlphaMode;
  maxPixelRatio?: number;
  label?: string;
  /** Re-initialise after the browser drops the device. On by default: a
   * loss is routine (driver reset, GPU switch, a tab parked too long) and
   * a page that does not recover is a page that goes blank for good. */
  autoRecover?: boolean;
  /** How many times in a row to recover before giving up and waiting for a
   * `retry()`. A device that dies on arrival would otherwise be re-requested
   * forever, which is a hot loop, not a recovery. Default 3. */
  maxRecoveries?: number;
  onSessionReady?: (session: WebGpuSession) => void;
  onSessionEnd?: (session: WebGpuSession) => void;
  onFailure?: (failure: WebGpuFailure) => void;
  onResize?: (session: WebGpuSession, width: number, height: number) => void;
}

/**
 * A session that ran this long before dying was a working session, not part
 * of a loop, so its loss does not count against the recovery budget.
 */
const HEALTHY_SESSION_MS = 10_000;

const DEFAULT_MAX_RECOVERIES = 3;

export interface UseWebGpuResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  session: WebGpuSession | null;
  status: WebGpuStatus;
  failure: WebGpuFailure | null;
  /** Re-runs initialisation from scratch. Safe to call in any state. */
  retry: () => void;
  /** Re-syncs the backing store to the CSS box; true if the size moved. */
  resize: () => boolean;
}

/**
 * Owns a WebGPU session for one canvas: initialises it, keeps its backing
 * store matched to the element, tears it down on unmount, and re-acquires a
 * device when the browser takes one away.
 *
 * It draws nothing. `session.context` is configured and idle — the canvas
 * shows whatever it showed before, transparent by default, until a renderer
 * submits its first frame (see `useWebGpuFrame`).
 */
export default function useWebGpu(
  options: UseWebGpuOptions = {},
): UseWebGpuResult {
  const {
    enabled = true,
    powerPreference,
    requiredFeatures,
    optionalFeatures,
    requiredLimits,
    alphaMode = "premultiplied",
    maxPixelRatio,
    label,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [session, setSession] = useState<WebGpuSession | null>(null);
  const [failure, setFailure] = useState<WebGpuFailure | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Callbacks and tunables are read through refs at call time. Held in the
  // effect's dependency list instead, an inline `onSessionReady={() => …}`
  // would tear the device down and build a new one on every parent render.
  // The write happens in an effect, not during render: a ref mutated mid-
  // render is torn between React's passes.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  // Mirrors `session` for `resize`, which runs from a ResizeObserver rather
  // than from the render that would close over the state.
  const sessionRef = useRef<WebGpuSession | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const generationRef = useRef(0);
  const recoveriesRef = useRef(0);

  // Arrays and objects from a caller are new identities every render, so the
  // effect keys off their content instead. Cheap: these lists are a handful
  // of short strings, and only re-run a device request when they truly move.
  const featuresKey = useMemo(
    () => JSON.stringify([requiredFeatures ?? [], optionalFeatures ?? []]),
    [requiredFeatures, optionalFeatures],
  );
  const limitsKey = useMemo(
    () => JSON.stringify(requiredLimits ?? {}),
    [requiredLimits],
  );

  const retry = useCallback(() => {
    // A hand retry is the user saying "start over", so the recovery budget
    // and the standing failure both reset with it.
    recoveriesRef.current = 0;
    setFailure(null);
    setAttempt((value) => value + 1);
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const device = sessionRef.current?.device;
    const changed = WebGpuLibrary.sizeCanvasToDisplay(canvas, {
      maxPixelRatio: optionsRef.current.maxPixelRatio,
      maxDimension: device ? WebGpuLibrary.maxDimensionOf(device) : undefined,
    });

    if (changed && sessionRef.current) {
      optionsRef.current.onResize?.(
        sessionRef.current,
        canvas.width,
        canvas.height,
      );
    }
    return changed;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;

    // Three guards, because they answer different questions. `cancelled`
    // stops the async continuation from touching React state after teardown;
    // `live` is the session this run owns, which teardown must destroy even
    // if it arrives after the unmount (React 19 StrictMode mounts, unmounts
    // and remounts every effect — without this the first device leaks); and
    // `intentionalTeardown` separates our own destroy from a real loss.
    let cancelled = false;
    let live: WebGpuSession | null = null;
    let intentionalTeardown = false;
    let readyAt = 0;

    // Size before the context is configured: the first `getCurrentTexture()`
    // allocates at whatever the canvas measures then, and a default 300 × 150
    // swap chain stretched over a full-width element is the classic blur.
    WebGpuLibrary.sizeCanvasToDisplay(canvas, { maxPixelRatio });

    WebGpuLibrary.initialize({
      canvas,
      powerPreference,
      requiredFeatures,
      optionalFeatures,
      requiredLimits,
      alphaMode,
      label,
      onDeviceLost: (info) => {
        // Our own `destroy()` resolves this promise too, with reason
        // "destroyed". That is a teardown, not a loss, and recovering from
        // it would resurrect the very session the caller just released.
        if (intentionalTeardown || info.reason === "destroyed") return;
        if (live) optionsRef.current.onSessionEnd?.(live);
        live = null;
        if (cancelled) return;

        // A session that stood for a while was healthy; only back-to-back
        // losses spend the budget.
        if (readyAt && Date.now() - readyAt > HEALTHY_SESSION_MS) {
          recoveriesRef.current = 0;
        }

        const budget =
          optionsRef.current.maxRecoveries ?? DEFAULT_MAX_RECOVERIES;
        const canRecover =
          optionsRef.current.autoRecover !== false &&
          recoveriesRef.current < budget;
        const message = info.message || "The GPU device was lost.";

        setSession(null);
        setFailure({
          kind: "device-lost",
          message: canRecover
            ? message
            : `${message} Recovery gave up after ${budget} attempts.`,
        });

        if (canRecover) {
          recoveriesRef.current += 1;
          setAttempt((value) => value + 1);
        }
      },
      onUncapturedError: (error) => {
        // Not fatal — the device survives a validation error — so the
        // session is left standing and the error only reported.
        console.error("[WebGPU] uncaptured error", error);
      },
    })
      .then((result) => {
        if (!result.ok) {
          if (cancelled) return;
          setFailure(result.failure);
          optionsRef.current.onFailure?.(result.failure);
          return;
        }

        live = { ...result.session, generation: ++generationRef.current };

        if (cancelled) {
          // The effect was torn down while the device was in flight.
          WebGpuLibrary.destroySession(live);
          live = null;
          return;
        }

        // Size again with the device's real ceiling now that there is one:
        // the pre-init pass had to guess at `maxTextureDimension2D`.
        WebGpuLibrary.sizeCanvasToDisplay(canvas, {
          maxPixelRatio,
          maxDimension: WebGpuLibrary.maxDimensionOf(live.device),
        });

        readyAt = Date.now();
        setFailure(null);
        setSession(live);
        optionsRef.current.onSessionReady?.(live);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const thrown: WebGpuFailure = {
          kind: "error",
          message: error instanceof Error ? error.message : String(error),
          cause: error,
        };
        setFailure(thrown);
        optionsRef.current.onFailure?.(thrown);
      });

    return () => {
      cancelled = true;
      if (!live) return;
      intentionalTeardown = true;
      optionsRef.current.onSessionEnd?.(live);
      WebGpuLibrary.destroySession(live);
      live = null;
      sessionRef.current = null;
      setSession(null);
    };
    // `attempt` is the retry/recovery trigger; the keys stand in for the
    // caller's arrays and objects, whose identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    attempt,
    powerPreference,
    alphaMode,
    label,
    maxPixelRatio,
    featuresKey,
    limitsKey,
  ]);

  // Keep the backing store on the element. A ResizeObserver catches every
  // cause — window resize, a flexbox neighbour growing, a sidebar opening —
  // where a window listener catches only one of them.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [resize, session]);

  // Derived, not stored: every input is already state, and a status held in
  // its own `useState` would need a synchronous set inside the effect above
  // to stay honest — the cascading-render shape React 19 warns about.
  const status: WebGpuStatus = !enabled
    ? "idle"
    : session
      ? "ready"
      : failure
        ? failure.kind === "unsupported"
          ? "unsupported"
          : failure.kind === "device-lost"
            ? "lost"
            : "error"
        : "initializing";

  return { canvasRef, session, status, failure, retry, resize };
}
