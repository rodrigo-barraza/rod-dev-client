// ============================================================
// rod.dev Client — WebGPU Library
// ============================================================
//
// The framework-free half of WebGPU support: adapter and device
// negotiation, canvas configuration, backing-store sizing, shader
// compilation and error scopes. Nothing here touches React, so it can be
// driven from a worker, a test, or a plain script as readily as from the
// hook in `@/hooks/useWebGpu`.
//
// It renders nothing. There is no clear, no pass, no draw — a session
// initialised through this library leaves the canvas exactly as
// transparent as it found it, and the first frame is submitted by
// whatever renderer gets built on top.
// ============================================================

import type {
  WebGpuAdapterReport,
  WebGpuFailure,
  WebGpuInitOptions,
  WebGpuSession,
  WebGpuSizeOptions,
} from "@/types/types";

/**
 * `bgra8unorm` is the format every implementation must accept for a canvas,
 * so it stands in when `getPreferredCanvasFormat` is unavailable (an older
 * implementation, or a test environment with a partial stub).
 */
const FALLBACK_FORMAT: GPUTextureFormat = "bgra8unorm";

/** Every WebGPU implementation guarantees at least this. */
const FALLBACK_MAX_DIMENSION = 8192;

/**
 * `GPUTextureUsage.RENDER_ATTACHMENT`, spelled out.
 *
 * The enum is a global that only exists where WebGPU does: reading it under
 * jsdom or during a server render is a ReferenceError, not an undefined.
 * The values are fixed by the specification, so the literal is safe.
 */
const RENDER_ATTACHMENT =
  typeof GPUTextureUsage === "undefined"
    ? 0x10
    : GPUTextureUsage.RENDER_ATTACHMENT;

const DEFAULT_MAX_PIXEL_RATIO = 2;

/**
 * One adapter probe per page load, shared by every caller. Requesting an
 * adapter is not free — on some drivers it spins one up — and the answer
 * cannot change without a reload.
 */
let supportProbe: Promise<boolean> | null = null;

function toFailure(
  kind: WebGpuFailure["kind"],
  message: string,
  cause?: unknown,
) {
  return { kind, message, cause } satisfies WebGpuFailure;
}

function messageOf(cause: unknown) {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === "string") return cause;
  return String(cause);
}

const WebGpuLibrary = {
  // ─── Capability ─────────────────────────────────────────────

  /**
   * Whether the API surface exists at all. Synchronous and safe on the
   * server, where `navigator` is undefined — every entry point below is
   * reachable from a component that Next renders on both sides.
   *
   * A `true` here does not promise an adapter: Chrome exposes
   * `navigator.gpu` on machines whose GPU is blocklisted, and the request
   * then resolves to `null`. Use `probeSupport` when the answer matters.
   */
  isSupported(): boolean {
    return typeof navigator !== "undefined" && Boolean(navigator.gpu);
  },

  /**
   * Whether an adapter can actually be had. Memoised for the page's
   * lifetime; the result is what a "does this machine do WebGPU" badge
   * should be driven from.
   */
  async probeSupport(): Promise<boolean> {
    if (!this.isSupported()) return false;
    supportProbe ??= navigator.gpu
      .requestAdapter()
      .then((adapter) => Boolean(adapter))
      .catch(() => false);
    return supportProbe;
  },

  /** Test seam: drops the memoised probe. */
  resetSupportProbe() {
    supportProbe = null;
  },

  /**
   * The format the compositor wants for this display. Configuring a canvas
   * with anything else costs a conversion blit per frame, so a renderer
   * should thread this through its pipelines rather than hardcode one.
   */
  getPreferredFormat(): GPUTextureFormat {
    if (!this.isSupported()) return FALLBACK_FORMAT;
    return navigator.gpu.getPreferredCanvasFormat?.() ?? FALLBACK_FORMAT;
  },

  // ─── Negotiation ────────────────────────────────────────────

  /**
   * Keeps only the features the adapter actually has.
   *
   * `requestDevice` rejects the whole request on one unknown or
   * unsupported feature name, which turns an optional nicety into a total
   * failure. Filtering first is what makes "optional" mean optional.
   */
  negotiateFeatures(
    adapter: GPUAdapter,
    features: GPUFeatureName[] = [],
  ): GPUFeatureName[] {
    return features.filter((feature) => adapter.features.has(feature));
  },

  /**
   * Clamps each requested limit to what the adapter reports.
   *
   * Limits are not all "bigger is better" — `minUniformBufferOffsetAlignment`
   * and `minStorageBufferOffsetAlignment` are floors, where the adapter's
   * value is the *smallest* that may be asked for, and a request below it
   * is the rejection. Both directions are handled here so a caller can pass
   * a wishlist and get a device.
   */
  negotiateLimits(
    adapter: GPUAdapter,
    limits: Record<string, number> = {},
  ): Record<string, number> {
    const negotiated: Record<string, number> = {};
    const supported = adapter.limits as unknown as Record<string, number>;

    for (const [name, wanted] of Object.entries(limits)) {
      const available = supported?.[name];
      if (typeof available !== "number") continue;
      negotiated[name] = name.startsWith("min")
        ? Math.max(wanted, available)
        : Math.min(wanted, available);
    }

    return negotiated;
  },

  /**
   * Flattens an adapter into plain data for state and diagnostics.
   *
   * `adapter.info` is the current spelling; `requestAdapterInfo()` was the
   * older one and still ships in some builds, so both are tried. Browsers
   * redact these strings by default outside of a secure, permitted context
   * — empty fields are the norm, not a bug.
   */
  async describeAdapter(adapter: GPUAdapter): Promise<WebGpuAdapterReport> {
    type LegacyAdapter = GPUAdapter & {
      requestAdapterInfo?: () => Promise<GPUAdapterInfo>;
    };

    let info: GPUAdapterInfo | undefined = adapter.info;
    if (!info) {
      const legacy = adapter as LegacyAdapter;
      info = await legacy.requestAdapterInfo?.().catch(() => undefined);
    }

    const limits: Record<string, number> = {};
    const rawLimits = adapter.limits as unknown as Record<string, unknown>;
    // `GPUSupportedLimits` is an interface with getters, not an own-property
    // bag: `Object.entries` on it comes back empty. The names have to be
    // walked off the prototype chain.
    for (const name of this.limitNames(adapter.limits)) {
      const value = rawLimits[name];
      if (typeof value === "number") limits[name] = value;
    }

    return {
      vendor: info?.vendor ?? "",
      architecture: info?.architecture ?? "",
      device: info?.device ?? "",
      description: info?.description ?? "",
      isFallbackAdapter: Boolean(
        (adapter as GPUAdapter & { isFallbackAdapter?: boolean })
          .isFallbackAdapter ?? info?.isFallbackAdapter,
      ),
      features: [...adapter.features].sort(),
      limits,
      preferredFormat: this.getPreferredFormat(),
    };
  },

  /** Every limit name on a `GPUSupportedLimits`, own or inherited. */
  limitNames(limits: GPUSupportedLimits): string[] {
    const names = new Set<string>();
    let cursor: object | null = limits;
    while (cursor && cursor !== Object.prototype) {
      for (const name of Object.getOwnPropertyNames(cursor)) {
        if (name !== "constructor") names.add(name);
      }
      cursor = Object.getPrototypeOf(cursor);
    }
    return [...names].sort();
  },

  // ─── Session ────────────────────────────────────────────────

  /**
   * Adapter → device → configured canvas, or a typed failure.
   *
   * Returns rather than throws: every step here fails for an ordinary
   * environmental reason (no browser support, a blocklisted GPU, a canvas
   * that already handed out a 2D context), and callers want to render a
   * fallback for each, not catch an exception.
   *
   * The device is *not* destroyed on a partial failure path only because
   * there is nothing to destroy — anything acquired before the failure is
   * released before returning.
   */
  async initialize(
    options: WebGpuInitOptions,
  ): Promise<
    { ok: true; session: WebGpuSession } | { ok: false; failure: WebGpuFailure }
  > {
    const {
      canvas,
      powerPreference,
      requiredFeatures = [],
      optionalFeatures = [],
      requiredLimits = {},
      alphaMode = "premultiplied",
      usage = 0,
      toneMapping,
      label,
      onDeviceLost,
      onUncapturedError,
    } = options;

    if (!this.isSupported()) {
      return {
        ok: false,
        failure: toFailure(
          "unsupported",
          "This browser does not expose navigator.gpu. WebGPU needs a current Chrome, Edge, Firefox or Safari, over HTTPS or localhost.",
        ),
      };
    }

    let adapter: GPUAdapter | null = null;
    try {
      adapter = await navigator.gpu.requestAdapter(
        powerPreference ? { powerPreference } : undefined,
      );
    } catch (error) {
      return {
        ok: false,
        failure: toFailure("no-adapter", messageOf(error), error),
      };
    }

    if (!adapter) {
      return {
        ok: false,
        failure: toFailure(
          "no-adapter",
          "No GPU adapter was available. The GPU may be blocklisted by the browser, or unavailable to this process.",
        ),
      };
    }

    const missing = requiredFeatures.filter(
      (feature) => !adapter.features.has(feature),
    );
    if (missing.length) {
      return {
        ok: false,
        failure: toFailure(
          "no-device",
          `The adapter is missing required feature(s): ${missing.join(", ")}.`,
        ),
      };
    }

    let device: GPUDevice;
    try {
      device = await adapter.requestDevice({
        label,
        requiredFeatures: [
          ...requiredFeatures,
          ...this.negotiateFeatures(adapter, optionalFeatures),
        ],
        requiredLimits: this.negotiateLimits(adapter, requiredLimits),
      });
    } catch (error) {
      return {
        ok: false,
        failure: toFailure("no-device", messageOf(error), error),
      };
    }

    const context = canvas.getContext("webgpu") as GPUCanvasContext | null;
    if (!context) {
      // A canvas hands out one context kind for its lifetime. If something
      // asked this element for "2d" first, "webgpu" comes back null forever
      // — the device would otherwise leak on the way out.
      device.destroy();
      return {
        ok: false,
        failure: toFailure(
          "no-context",
          "The canvas would not give a WebGPU context. An element can only ever hold one context kind.",
        ),
      };
    }

    const format = this.getPreferredFormat();

    try {
      context.configure({
        device,
        format,
        alphaMode,
        usage: RENDER_ATTACHMENT | usage,
        ...(toneMapping ? { toneMapping } : {}),
      });
    } catch (error) {
      device.destroy();
      return {
        ok: false,
        failure: toFailure("error", messageOf(error), error),
      };
    }

    // Uncaptured errors are the ones no error scope was open for. Without a
    // handler they land in the console and nowhere else, which is how a
    // renderer ends up quietly drawing nothing.
    if (onUncapturedError) {
      device.addEventListener("uncapturederror", (event) => {
        onUncapturedError((event as GPUUncapturedErrorEvent).error);
      });
    }

    if (onDeviceLost) {
      // `device.lost` also resolves for our own `destroy()`, with reason
      // "destroyed". The hook filters that case — a teardown is not a loss.
      device.lost.then(onDeviceLost).catch(() => {});
    }

    const report = await this.describeAdapter(adapter);

    return {
      ok: true,
      session: {
        generation: 0,
        adapter,
        device,
        context,
        canvas,
        format,
        alphaMode,
        report,
      },
    };
  },

  /**
   * Releases a session. Unconfiguring first drops the swap-chain textures
   * while the device that owns them is still alive; destroying the device
   * then invalidates every buffer, texture and pipeline built against it.
   */
  destroySession(session: WebGpuSession) {
    try {
      session.context.unconfigure();
    } catch {
      // A context whose device is already gone throws here. Nothing to do
      // about it, and nothing that follows depends on it.
    }
    session.device.destroy();
  },

  // ─── Sizing ─────────────────────────────────────────────────

  /**
   * Matches the canvas backing store to its CSS box.
   *
   * WebGPU never resizes it: the canvas keeps whatever `width`/`height`
   * attributes it was given and the compositor stretches the result, so a
   * 300 × 150 default scaled across a viewport is the classic "why is it
   * blurry". The context does not need reconfiguring afterwards — the next
   * `getCurrentTexture()` allocates at the new size.
   *
   * Returns whether anything changed, so a caller can skip the reallocation
   * of its own size-dependent targets on the frames where nothing moved.
   */
  sizeCanvasToDisplay(
    canvas: HTMLCanvasElement,
    options: WebGpuSizeOptions = {},
  ): boolean {
    const {
      maxPixelRatio = DEFAULT_MAX_PIXEL_RATIO,
      maxDimension = FALLBACK_MAX_DIMENSION,
    } = options;

    const ratio = Math.min(
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
      maxPixelRatio,
    );

    const rect = canvas.getBoundingClientRect();
    const cssWidth = rect.width || canvas.clientWidth || 1;
    const cssHeight = rect.height || canvas.clientHeight || 1;

    const width = Math.max(
      1,
      Math.min(Math.round(cssWidth * ratio), maxDimension),
    );
    const height = Math.max(
      1,
      Math.min(Math.round(cssHeight * ratio), maxDimension),
    );

    if (canvas.width === width && canvas.height === height) return false;

    canvas.width = width;
    canvas.height = height;
    return true;
  },

  /** The size ceiling this device can actually hold in one texture. */
  maxDimensionOf(device: GPUDevice): number {
    return device.limits?.maxTextureDimension2D ?? FALLBACK_MAX_DIMENSION;
  },

  // ─── Authoring helpers ──────────────────────────────────────

  /**
   * Compiles WGSL and reports what the driver said about it.
   *
   * `createShaderModule` never throws — a module with a syntax error is
   * returned intact and only fails later, at pipeline creation, with a
   * message that names the pipeline rather than the line. Reading the
   * compilation info here puts the error on the shader that caused it.
   */
  async createShaderModule(
    device: GPUDevice,
    code: string,
    label?: string,
  ): Promise<GPUShaderModule> {
    // Not named `module`: Next forbids assigning that identifier, since it
    // shadows the CommonJS global in any file that ends up bundled as one.
    const shaderModule = device.createShaderModule({ code, label });

    const info = await shaderModule.getCompilationInfo?.();
    const errors = (info?.messages ?? []).filter(
      (message) => message.type === "error",
    );

    if (errors.length) {
      const detail = errors
        .map(
          (message) =>
            `${label ?? "shader"}:${message.lineNum}:${message.linePos} ${message.message}`,
        )
        .join("\n");
      throw new Error(`WGSL compilation failed\n${detail}`);
    }

    return shaderModule;
  },

  /**
   * Runs `work` inside an error scope and hands back what the GPU said.
   *
   * WebGPU is fire-and-forget: an invalid buffer write or a bad pipeline
   * descriptor does not throw where it is written. A scope is the only way
   * to attribute an error to the block that caused it, which is worth the
   * round trip while a renderer is being built.
   */
  async withErrorScope<T>(
    device: GPUDevice,
    filter: GPUErrorFilter,
    work: () => T | Promise<T>,
  ): Promise<{ value: T; error: GPUError | null }> {
    device.pushErrorScope(filter);
    try {
      const value = await work();
      return { value, error: await device.popErrorScope() };
    } catch (error) {
      // The scope has to be popped even on a throw, or every later
      // pop in the process returns this one's error instead of its own.
      await device.popErrorScope().catch(() => null);
      throw error;
    }
  },
};

export default WebGpuLibrary;
