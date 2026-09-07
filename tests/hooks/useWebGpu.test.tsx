import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import useWebGpu from "@/hooks/useWebGpu";
import WebGpuLibrary from "@/libraries/WebGpuLibrary";
import {
  createMockCanvas,
  createMockDevice,
  installMockGpu,
  uninstallMockGpu,
} from "../support/webgpuMock";

/**
 * The hook takes its canvas through a ref an element fills in. These tests
 * have no renderer, so the ref is planted by hand and the effect re-run —
 * the same order React produces, minus the DOM.
 */
function renderWebGpu(canvas: HTMLCanvasElement) {
  const view = renderHook(({ enabled }) => useWebGpu({ enabled }), {
    initialProps: { enabled: false },
  });
  act(() => {
    view.result.current.canvasRef.current = canvas;
  });
  view.rerender({ enabled: true });
  return view;
}

describe("useWebGpu", () => {
  afterEach(() => {
    uninstallMockGpu();
    WebGpuLibrary.resetSupportProbe();
    vi.restoreAllMocks();
  });

  it("reaches ready with a session on a machine that has a GPU", async () => {
    const { device } = installMockGpu();
    const { canvas } = createMockCanvas();

    const { result } = renderWebGpu(canvas);

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.session?.device).toBe(device);
    expect(result.current.session?.generation).toBeGreaterThan(0);
    expect(result.current.failure).toBeNull();
  });

  it("lands on unsupported without navigator.gpu", async () => {
    uninstallMockGpu();
    const { canvas } = createMockCanvas();

    const { result } = renderWebGpu(canvas);

    await waitFor(() => expect(result.current.status).toBe("unsupported"));
    expect(result.current.session).toBeNull();
    expect(result.current.failure?.kind).toBe("unsupported");
  });

  it("lands on error when the adapter refuses a device", async () => {
    installMockGpu({ requestDeviceRejects: "no device for you" });
    const { canvas } = createMockCanvas();

    const { result } = renderWebGpu(canvas);

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.failure?.message).toBe("no device for you");
  });

  it("destroys the device on unmount", async () => {
    const { device } = installMockGpu();
    const { canvas } = createMockCanvas();

    const { result, unmount } = renderWebGpu(canvas);
    await waitFor(() => expect(result.current.status).toBe("ready"));

    unmount();
    expect(device.destroy).toHaveBeenCalled();
  });

  it("does not initialise while disabled", async () => {
    const { gpu } = installMockGpu();
    const { canvas } = createMockCanvas();

    const view = renderHook(({ enabled }) => useWebGpu({ enabled }), {
      initialProps: { enabled: false },
    });
    act(() => {
      view.result.current.canvasRef.current = canvas;
    });

    expect(gpu.requestAdapter).not.toHaveBeenCalled();
    expect(view.result.current.status).toBe("idle");
  });

  it("recovers with a fresh generation after the device is lost", async () => {
    const first = createMockDevice();
    installMockGpu({ device: first });
    const { canvas } = createMockCanvas();

    const { result } = renderWebGpu(canvas);
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const firstGeneration = result.current.session?.generation ?? 0;

    await act(async () => {
      first.loseDevice("unknown", "the driver reset");
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.session?.generation).toBe(firstGeneration + 1);
  });

  it("reports a lost device to the caller and ends the old session", async () => {
    const device = createMockDevice();
    installMockGpu({ device });
    const { canvas } = createMockCanvas();
    const onSessionEnd = vi.fn();

    const view = renderHook(
      ({ enabled }) => useWebGpu({ enabled, autoRecover: false, onSessionEnd }),
      { initialProps: { enabled: false } },
    );
    act(() => {
      view.result.current.canvasRef.current = canvas;
    });
    view.rerender({ enabled: true });

    await waitFor(() => expect(view.result.current.status).toBe("ready"));

    await act(async () => {
      device.loseDevice("unknown", "gone");
      await Promise.resolve();
    });

    await waitFor(() => expect(view.result.current.status).toBe("lost"));
    expect(view.result.current.failure?.kind).toBe("device-lost");
    expect(onSessionEnd).toHaveBeenCalled();
  });

  it("stops recovering after the budget and waits for a hand retry", async () => {
    const { gpu, devices, device } = installMockGpu();
    const { canvas } = createMockCanvas();

    const view = renderHook(
      ({ enabled }) => useWebGpu({ enabled, maxRecoveries: 2 }),
      { initialProps: { enabled: false } },
    );
    act(() => {
      view.result.current.canvasRef.current = canvas;
    });
    view.rerender({ enabled: true });

    await waitFor(() => expect(view.result.current.status).toBe("ready"));

    // Three losses against a budget of two: the third is not recovered from.
    for (let round = 0; round < 3; round += 1) {
      const current = devices[devices.length - 1] ?? device;
      await act(async () => {
        current.loseDevice("unknown", "gone");
        await Promise.resolve();
      });
      if (round < 2) {
        await waitFor(() => expect(view.result.current.status).toBe("ready"));
      }
    }

    await waitFor(() => expect(view.result.current.status).toBe("lost"));
    expect(view.result.current.failure?.message).toContain("gave up");

    const adapterRequests = gpu.requestAdapter.mock.calls.length;
    act(() => view.result.current.retry());
    await waitFor(() =>
      expect(gpu.requestAdapter.mock.calls.length).toBe(adapterRequests + 1),
    );
  });

  it("re-initialises on retry", async () => {
    const { gpu } = installMockGpu({ requestDeviceRejects: "not today" });
    const { canvas } = createMockCanvas();

    const { result } = renderWebGpu(canvas);
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => result.current.retry());

    await waitFor(() => expect(gpu.requestAdapter).toHaveBeenCalledTimes(2));
  });

  it("sizes the canvas to its box and reports the resize", async () => {
    installMockGpu();
    const { canvas } = createMockCanvas(500, 250);
    window.devicePixelRatio = 1;

    const { result } = renderWebGpu(canvas);
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect([canvas.width, canvas.height]).toEqual([500, 250]);
    expect(result.current.resize()).toBe(false);
  });
});
