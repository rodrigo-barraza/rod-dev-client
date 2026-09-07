import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import useWebGpuFrame from "@/hooks/useWebGpuFrame";
import type { WebGpuSession } from "@/types/types";
import { createMockCanvas } from "../support/webgpuMock";

/** A session shaped enough for the loop: it only reads the canvas. */
function fakeSession(): WebGpuSession {
  const { canvas } = createMockCanvas();
  canvas.width = 800;
  canvas.height = 450;
  return { canvas } as unknown as WebGpuSession;
}

describe("useWebGpuFrame", () => {
  let now = 0;
  let callbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    now = 0;
    callbacks = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Advances the clock and runs whatever rAF callback is pending. */
  function tick(ms: number) {
    now += ms;
    const pending = callbacks;
    callbacks = [];
    act(() => {
      pending.forEach((callback) => callback(now));
    });
  }

  it("submits nothing without a render callback", () => {
    const { result } = renderHook(() => useWebGpuFrame(fakeSession()));

    expect(result.current.isRunning).toBe(false);
    expect(callbacks).toHaveLength(0);
  });

  it("submits nothing without a session", () => {
    const render = vi.fn();
    renderHook(() => useWebGpuFrame(null, render));

    expect(callbacks).toHaveLength(0);
    expect(render).not.toHaveBeenCalled();
  });

  it("drives the render callback with frame timing", () => {
    const render = vi.fn();
    const session = fakeSession();
    renderHook(() => useWebGpuFrame(session, render));

    tick(0);
    tick(16);

    expect(render).toHaveBeenCalledTimes(2);
    const second = render.mock.calls[1][0];
    expect(second.frame).toBe(2);
    expect(second.deltaTime).toBe(16);
    expect(second.time).toBe(16);
    expect(second.width).toBe(800);
    expect(second.height).toBe(450);
    expect(second.session).toBe(session);
  });

  it("clamps a long gap so a paused tab does not hand out a huge step", () => {
    const render = vi.fn();
    renderHook(() =>
      useWebGpuFrame(fakeSession(), render, { maxDeltaTime: 50 }),
    );

    tick(0);
    tick(5000);

    expect(render.mock.calls[1][0].deltaTime).toBe(50);
  });

  it("stops when disabled", () => {
    const render = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) => useWebGpuFrame(fakeSession(), render, { enabled }),
      { initialProps: { enabled: true } },
    );

    tick(0);
    const calls = render.mock.calls.length;

    rerender({ enabled: false });
    tick(16);

    expect(render.mock.calls.length).toBe(calls);
  });
});
