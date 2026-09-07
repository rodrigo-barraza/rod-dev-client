import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import WebGpuLibrary from "@/libraries/WebGpuLibrary";
import {
  createMockCanvas,
  createMockDevice,
  installMockGpu,
  uninstallMockGpu,
} from "../support/webgpuMock";

describe("WebGpuLibrary", () => {
  beforeEach(() => {
    WebGpuLibrary.resetSupportProbe();
  });

  afterEach(() => {
    uninstallMockGpu();
    vi.restoreAllMocks();
  });

  describe("support", () => {
    it("reports unsupported when navigator.gpu is absent", async () => {
      uninstallMockGpu();
      expect(WebGpuLibrary.isSupported()).toBe(false);
      await expect(WebGpuLibrary.probeSupport()).resolves.toBe(false);
    });

    it("reports supported once an adapter answers", async () => {
      installMockGpu();
      expect(WebGpuLibrary.isSupported()).toBe(true);
      await expect(WebGpuLibrary.probeSupport()).resolves.toBe(true);
    });

    it("reports unsupported when the API exists but no adapter does", async () => {
      installMockGpu({ adapter: false });
      expect(WebGpuLibrary.isSupported()).toBe(true);
      await expect(WebGpuLibrary.probeSupport()).resolves.toBe(false);
    });

    it("probes the adapter only once per page load", async () => {
      const { gpu } = installMockGpu();
      await Promise.all([
        WebGpuLibrary.probeSupport(),
        WebGpuLibrary.probeSupport(),
      ]);
      await WebGpuLibrary.probeSupport();
      expect(gpu.requestAdapter).toHaveBeenCalledTimes(1);
    });

    it("falls back to bgra8unorm without a preferred format", () => {
      installMockGpu();
      expect(WebGpuLibrary.getPreferredFormat()).toBe("bgra8unorm");
      uninstallMockGpu();
      expect(WebGpuLibrary.getPreferredFormat()).toBe("bgra8unorm");
    });
  });

  describe("negotiation", () => {
    it("drops optional features the adapter does not have", () => {
      const { adapter } = installMockGpu({ features: ["timestamp-query"] });
      const negotiated = WebGpuLibrary.negotiateFeatures(
        adapter as unknown as GPUAdapter,
        ["timestamp-query", "shader-f16"] as GPUFeatureName[],
      );
      expect(negotiated).toEqual(["timestamp-query"]);
    });

    it("clamps a ceiling limit down and a floor limit up", () => {
      const { adapter } = installMockGpu({
        limits: {
          maxTextureDimension2D: 8192,
          minUniformBufferOffsetAlignment: 256,
        },
      });

      const negotiated = WebGpuLibrary.negotiateLimits(
        adapter as unknown as GPUAdapter,
        {
          maxTextureDimension2D: 16384,
          minUniformBufferOffsetAlignment: 64,
          notARealLimit: 1,
        },
      );

      expect(negotiated).toEqual({
        maxTextureDimension2D: 8192,
        minUniformBufferOffsetAlignment: 256,
      });
    });
  });

  describe("initialize", () => {
    it("configures the canvas and returns a session", async () => {
      const { device } = installMockGpu();
      const { canvas, context } = createMockCanvas();

      const result = await WebGpuLibrary.initialize({ canvas });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.session.device).toBe(device);
      expect(result.session.format).toBe("bgra8unorm");
      expect(context.configure).toHaveBeenCalledWith(
        expect.objectContaining({
          device,
          format: "bgra8unorm",
          alphaMode: "premultiplied",
        }),
      );
      expect(result.session.report.vendor).toBe("mock-vendor");
      expect(result.session.report.features).toEqual(["timestamp-query"]);
      expect(result.session.report.limits.maxTextureDimension2D).toBe(8192);
    });

    it("fails as unsupported without navigator.gpu", async () => {
      uninstallMockGpu();
      const { canvas } = createMockCanvas();

      const result = await WebGpuLibrary.initialize({ canvas });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.failure.kind).toBe("unsupported");
    });

    it("fails as no-adapter when the browser hands back none", async () => {
      installMockGpu({ adapter: false });
      const { canvas } = createMockCanvas();

      const result = await WebGpuLibrary.initialize({ canvas });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.failure.kind).toBe("no-adapter");
    });

    it("fails before requesting a device when a required feature is missing", async () => {
      const { requestDevice } = installMockGpu({ features: [] });
      const { canvas } = createMockCanvas();

      const result = await WebGpuLibrary.initialize({
        canvas,
        requiredFeatures: ["shader-f16"] as GPUFeatureName[],
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.failure.kind).toBe("no-device");
      expect(result.failure.message).toContain("shader-f16");
      expect(requestDevice).not.toHaveBeenCalled();
    });

    it("destroys the device when the canvas gives no webgpu context", async () => {
      const { device } = installMockGpu();
      const { canvas } = createMockCanvas();
      canvas.getContext = vi.fn(
        () => null,
      ) as unknown as HTMLCanvasElement["getContext"];

      const result = await WebGpuLibrary.initialize({ canvas });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.failure.kind).toBe("no-context");
      expect(device.destroy).toHaveBeenCalled();
    });

    it("reports a rejected device request rather than throwing", async () => {
      installMockGpu({ requestDeviceRejects: "device is on fire" });
      const { canvas } = createMockCanvas();

      const result = await WebGpuLibrary.initialize({ canvas });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.failure.kind).toBe("no-device");
      expect(result.failure.message).toBe("device is on fire");
    });

    it("passes only the negotiated features and limits to the device", async () => {
      const { deviceDescriptor } = installMockGpu({
        features: ["timestamp-query"],
        limits: { maxTextureDimension2D: 8192 },
      });
      const { canvas } = createMockCanvas();

      await WebGpuLibrary.initialize({
        canvas,
        optionalFeatures: ["timestamp-query", "shader-f16"] as GPUFeatureName[],
        requiredLimits: { maxTextureDimension2D: 16384 },
      });

      expect(deviceDescriptor()?.requiredFeatures).toEqual(["timestamp-query"]);
      expect(deviceDescriptor()?.requiredLimits).toEqual({
        maxTextureDimension2D: 8192,
      });
    });

    it("reports a device loss through the callback", async () => {
      const device = createMockDevice();
      installMockGpu({ device });
      const { canvas } = createMockCanvas();
      const onDeviceLost = vi.fn();

      await WebGpuLibrary.initialize({ canvas, onDeviceLost });
      device.loseDevice("unknown", "the driver reset");
      await Promise.resolve();

      expect(onDeviceLost).toHaveBeenCalledWith(
        expect.objectContaining({ message: "the driver reset" }),
      );
    });
  });

  describe("destroySession", () => {
    it("unconfigures the context before destroying the device", async () => {
      installMockGpu();
      const { canvas, context } = createMockCanvas();
      const result = await WebGpuLibrary.initialize({ canvas });
      if (!result.ok) throw new Error("expected a session");

      WebGpuLibrary.destroySession(result.session);

      expect(context.unconfigure).toHaveBeenCalled();
      expect(result.session.device.destroy).toHaveBeenCalled();
    });
  });

  describe("sizeCanvasToDisplay", () => {
    it("sizes the backing store from the CSS box and the pixel ratio", () => {
      const { canvas } = createMockCanvas(400, 200);
      window.devicePixelRatio = 2;

      expect(WebGpuLibrary.sizeCanvasToDisplay(canvas)).toBe(true);
      expect([canvas.width, canvas.height]).toEqual([800, 400]);
    });

    it("caps the pixel ratio", () => {
      const { canvas } = createMockCanvas(400, 200);
      window.devicePixelRatio = 4;

      WebGpuLibrary.sizeCanvasToDisplay(canvas, { maxPixelRatio: 1 });
      expect([canvas.width, canvas.height]).toEqual([400, 200]);
    });

    it("clamps to the device's maximum texture dimension", () => {
      const { canvas } = createMockCanvas(20000, 200);
      window.devicePixelRatio = 1;

      WebGpuLibrary.sizeCanvasToDisplay(canvas, { maxDimension: 4096 });
      expect(canvas.width).toBe(4096);
    });

    it("reports no change when the size already matches", () => {
      const { canvas } = createMockCanvas(400, 200);
      window.devicePixelRatio = 1;

      expect(WebGpuLibrary.sizeCanvasToDisplay(canvas)).toBe(true);
      expect(WebGpuLibrary.sizeCanvasToDisplay(canvas)).toBe(false);
    });
  });

  describe("createShaderModule", () => {
    it("throws with the line and column of a WGSL error", async () => {
      const device = createMockDevice();
      device.createShaderModule = vi.fn(() => ({
        getCompilationInfo: async () => ({
          messages: [
            { type: "error", lineNum: 3, linePos: 7, message: "unknown ident" },
            { type: "warning", lineNum: 1, linePos: 1, message: "unused" },
          ],
        }),
      }));

      await expect(
        WebGpuLibrary.createShaderModule(
          device as unknown as GPUDevice,
          "bad wgsl",
          "test-shader",
        ),
      ).rejects.toThrow("test-shader:3:7 unknown ident");
    });

    it("returns the module when the shader compiles", async () => {
      const device = createMockDevice();
      await expect(
        WebGpuLibrary.createShaderModule(
          device as unknown as GPUDevice,
          "ok wgsl",
        ),
      ).resolves.toBeTruthy();
    });
  });

  describe("withErrorScope", () => {
    it("pops the scope and hands back the captured error", async () => {
      const device = createMockDevice();
      const captured = { message: "invalid buffer" };
      device.popErrorScope = vi.fn(async () => captured);

      const result = await WebGpuLibrary.withErrorScope(
        device as unknown as GPUDevice,
        "validation",
        () => 42,
      );

      expect(device.pushErrorScope).toHaveBeenCalledWith("validation");
      expect(result.value).toBe(42);
      expect(result.error).toBe(captured);
    });

    it("pops the scope even when the work throws", async () => {
      const device = createMockDevice();

      await expect(
        WebGpuLibrary.withErrorScope(
          device as unknown as GPUDevice,
          "validation",
          () => {
            throw new Error("nope");
          },
        ),
      ).rejects.toThrow("nope");

      expect(device.popErrorScope).toHaveBeenCalledTimes(1);
    });
  });
});
