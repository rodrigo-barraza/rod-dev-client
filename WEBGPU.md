# WebGPU

Support is wired up end to end and renders nothing. A page can acquire a
device, configure a canvas, resize it, survive a device loss and run a frame
loop — but no pass is encoded anywhere in the client, so every canvas is
blank until a renderer is written.

`/webgpu` is the page to look at: it reports what the current browser's
adapter can do, with a live device behind an empty canvas.

## The pieces

| File                                    | What it owns                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/libraries/WebGpuLibrary.ts`        | Adapter/device negotiation, canvas configuration, sizing, WGSL compilation, error scopes. No React. |
| `src/hooks/useWebGpu.ts`                | One session per canvas: init, resize, teardown, device-loss recovery.                               |
| `src/hooks/useWebGpuFrame.ts`           | The `requestAnimationFrame` loop and its frame timing.                                              |
| `src/components/WebGpuCanvasComponent/` | The canvas element, its fallback and its overlay.                                                   |
| `src/app/webgpu/`                       | The capability report page.                                                                         |
| `src/types/types.ts`                    | `WebGpuSession`, `WebGpuStatus`, `WebGpuFailure`, `WebGpuAdapterReport`, …                          |

`@webgpu/types` supplies the ambient `GPU*` types; it is registered in
`tsconfig.json` under `compilerOptions.types`.

## Writing a renderer

```tsx
import WebGpuCanvasComponent from "@/components/WebGpuCanvasComponent/WebGpuCanvasComponent";
import WebGpuLibrary from "@/libraries/WebGpuLibrary";
import type { WebGpuSession, WebGpuFrame } from "@/types/types";

let pipeline: GPURenderPipeline | null = null;

async function build(session: WebGpuSession) {
  const shader = await WebGpuLibrary.createShaderModule(
    session.device,
    wgsl,
    "triangle",
  );
  pipeline = session.device.createRenderPipeline({
    layout: "auto",
    vertex: { module: shader },
    // `session.format` is the compositor's preferred format — a pipeline
    // built against anything else costs a conversion blit per frame.
    fragment: { module: shader, targets: [{ format: session.format }] },
  });
}

function draw({ session }: WebGpuFrame) {
  if (!pipeline) return;
  const encoder = session.device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: session.context.getCurrentTexture().createView(),
        loadOp: "clear",
        storeOp: "store",
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
      },
    ],
  });
  pass.setPipeline(pipeline);
  pass.draw(3);
  pass.end();
  session.device.queue.submit([encoder.finish()]);
}

<WebGpuCanvasComponent onSessionReady={build} onFrame={draw} />;
```

## Rules the support layer already enforces

- **Resources belong to a generation.** `session.generation` increments on
  every initialisation, including recovery from a lost device. Anything
  built in `onSessionReady` — buffers, pipelines, textures — dies with that
  device; rebuild it when a new session arrives, and release it in
  `onSessionEnd`.
- **Never call `getCurrentTexture()` outside a frame.** The texture it
  returns is valid for that frame only.
- **Features and limits are negotiated, not assumed.** Pass
  `optionalFeatures` / `requiredLimits` and read back what was granted from
  `session.report`; `requestDevice` rejects outright on anything the adapter
  does not have, which is why the library filters first.
- **The canvas is sized in JS.** `useWebGpu` matches the backing store to
  the CSS box at the capped device-pixel ratio and re-matches on every
  resize. Do not set `width`/`height` on the element yourself.
- **A device loss is normal.** Recovery is automatic, up to
  `maxRecoveries` (3) consecutive losses, after which `retry()` is the way
  back.
- **Errors are asynchronous.** A bad descriptor does not throw where it is
  written. Wrap suspect work in `WebGpuLibrary.withErrorScope` while
  building, and watch the console for uncaptured errors.

## Browser support

WebGPU needs a current Chrome/Edge, Firefox, or Safari 26+, served over
HTTPS or localhost. `WebGpuLibrary.isSupported()` answers whether the API
exists; `probeSupport()` (memoised, and mirrored into the Zustand store as
`isWebGpuSupported`) answers whether an adapter can actually be had — a
machine with a blocklisted GPU passes the first and fails the second.
