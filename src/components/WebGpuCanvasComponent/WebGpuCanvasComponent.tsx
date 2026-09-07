"use client";

import React from "react";
import style from "./WebGpuCanvasComponent.module.scss";
import useWebGpu from "@/hooks/useWebGpu";
import useWebGpuFrame from "@/hooks/useWebGpuFrame";
import type { WebGpuCanvasComponentProps } from "@/types/types";

/**
 * A canvas with a live WebGPU device behind it.
 *
 * Mounting it acquires an adapter, a device and a configured context, sizes
 * the backing store to the element, and keeps all three alive across
 * resizes and device losses. It submits no work of its own: with no
 * `onFrame` the canvas stays exactly as blank as an empty <div>, which is
 * the point — renderers plug into `onSessionReady` and `onFrame` as they
 * get written, and everything underneath them already works.
 *
 *   <WebGpuCanvasComponent
 *     onSessionReady={(session) => buildPipelines(session)}
 *     onFrame={({ session }) => drawOneFrame(session)}
 *   />
 */
export default function WebGpuCanvasComponent({
  className,
  style: inlineStyle,
  alphaMode,
  powerPreference,
  requiredFeatures,
  optionalFeatures,
  requiredLimits,
  maxPixelRatio,
  label,
  onSessionReady,
  onSessionEnd,
  onFailure,
  onFrame,
  onResize,
  fallback,
  children,
}: WebGpuCanvasComponentProps) {
  const { canvasRef, session, status, failure, retry } = useWebGpu({
    alphaMode,
    powerPreference,
    requiredFeatures,
    optionalFeatures,
    requiredLimits,
    maxPixelRatio,
    label,
    onSessionReady,
    onSessionEnd,
    onFailure,
    onResize,
  });

  useWebGpuFrame(session, onFrame);

  const isUnavailable = status === "unsupported" || status === "error";

  return (
    <div
      className={`${style.WebGpuCanvasComponent} ${className || ""}`}
      style={inlineStyle}
      data-webgpu-status={status}
    >
      {/* The element stays mounted through a failure: unmounting it would
          lose the ref the retry path needs, and a canvas that already gave
          out a context never gives out another kind. */}
      <canvas ref={canvasRef} className={style.canvas} />

      {isUnavailable && (
        <div className={style.fallback}>
          {fallback ?? (
            <>
              <p className={style.fallbackTitle}>
                {status === "unsupported"
                  ? "WebGPU is not available in this browser"
                  : "WebGPU could not start"}
              </p>
              {failure?.message && (
                <p className={style.fallbackMessage}>{failure.message}</p>
              )}
              {status === "error" && (
                <button
                  type="button"
                  className={style.fallbackRetry}
                  onClick={retry}
                >
                  Try again
                </button>
              )}
            </>
          )}
        </div>
      )}

      {children && <div className={style.overlay}>{children}</div>}
    </div>
  );
}
