import { vi } from "vitest";

/**
 * A stub standing in for the parts of WebGPU the library actually touches.
 * jsdom has no GPU and no `navigator.gpu`, so every test here drives this
 * instead — enough of the shape to exercise negotiation, configuration,
 * teardown and device loss, and no more.
 */

export interface MockDevice {
  label: string;
  limits: Record<string, number>;
  features: Set<string>;
  lost: Promise<GPUDeviceLostInfo>;
  destroyed: boolean;
  destroy: () => void;
  addEventListener: ReturnType<typeof vi.fn>;
  pushErrorScope: ReturnType<typeof vi.fn>;
  popErrorScope: ReturnType<typeof vi.fn>;
  createShaderModule: ReturnType<typeof vi.fn>;
  loseDevice: (reason?: string, message?: string) => void;
}

export function createMockDevice(
  limits: Record<string, number> = { maxTextureDimension2D: 8192 },
): MockDevice {
  let resolveLost: (info: GPUDeviceLostInfo) => void = () => {};
  const lost = new Promise<GPUDeviceLostInfo>((resolve) => {
    resolveLost = resolve;
  });

  const device: MockDevice = {
    label: "mock-device",
    limits,
    features: new Set<string>(),
    lost,
    destroyed: false,
    destroy: vi.fn(() => {
      device.destroyed = true;
      resolveLost({
        reason: "destroyed",
        message: "destroyed",
      } as GPUDeviceLostInfo);
    }),
    addEventListener: vi.fn(),
    pushErrorScope: vi.fn(),
    popErrorScope: vi.fn(async () => null),
    createShaderModule: vi.fn(() => ({
      getCompilationInfo: async () => ({ messages: [] }),
    })),
    loseDevice: (reason = "unknown", message = "lost") =>
      resolveLost({ reason, message } as unknown as GPUDeviceLostInfo),
  };

  return device;
}

export interface MockGpuOptions {
  adapter?: boolean;
  features?: string[];
  limits?: Record<string, number>;
  device?: MockDevice;
  requestDeviceRejects?: string;
}

export function installMockGpu(options: MockGpuOptions = {}) {
  const {
    adapter = true,
    features = ["timestamp-query"],
    limits = { maxTextureDimension2D: 8192, maxBufferSize: 268435456 },
    requestDeviceRejects,
  } = options;

  const device = options.device ?? createMockDevice(limits);
  const devices: MockDevice[] = [];
  let lastDeviceDescriptor: GPUDeviceDescriptor | undefined;

  // A fresh device per request after the first, because a real one is: its
  // `lost` promise is single-use, and handing the same already-resolved one
  // back to a recovering caller reports a loss the instant it initialises.
  const requestDevice = vi.fn(async (descriptor?: GPUDeviceDescriptor) => {
    lastDeviceDescriptor = descriptor;
    if (requestDeviceRejects) throw new Error(requestDeviceRejects);
    const next = devices.length === 0 ? device : createMockDevice(limits);
    devices.push(next);
    return next;
  });

  const mockAdapter = {
    features: new Set(features),
    limits,
    info: {
      vendor: "mock-vendor",
      architecture: "mock-arch",
      device: "mock-device",
      description: "mock adapter",
    },
    isFallbackAdapter: false,
    requestDevice,
  };

  const gpu = {
    requestAdapter: vi.fn(async () => (adapter ? mockAdapter : null)),
    getPreferredCanvasFormat: vi.fn(() => "bgra8unorm"),
  };

  Object.defineProperty(navigator, "gpu", {
    configurable: true,
    writable: true,
    value: gpu,
  });

  return {
    gpu,
    adapter: mockAdapter,
    device,
    devices,
    requestDevice,
    deviceDescriptor: () => lastDeviceDescriptor,
  };
}

export function uninstallMockGpu() {
  Object.defineProperty(navigator, "gpu", {
    configurable: true,
    writable: true,
    value: undefined,
  });
}

/**
 * jsdom's canvas has no "webgpu" context and no layout either — both are
 * patched onto the element so sizing and configuration can be exercised.
 */
export function createMockCanvas(width = 800, height = 450) {
  const canvas = document.createElement("canvas");
  const context = {
    configure: vi.fn(),
    unconfigure: vi.fn(),
    getCurrentTexture: vi.fn(),
  };

  canvas.getContext = vi.fn((kind: string) =>
    kind === "webgpu" ? context : null,
  ) as unknown as HTMLCanvasElement["getContext"];

  canvas.getBoundingClientRect = () =>
    ({
      width,
      height,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
    }) as DOMRect;

  return { canvas, context };
}
