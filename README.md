# rod.dev — Portfolio & Gym Tracker

Portfolio site for [rod.dev](https://rod.dev) — AI art gallery, project showcase, gym tracking, and AI image generation.

**Live:** [rod.dev](https://rod.dev)

## Features

### Portfolio

- **Home Gallery** — Masonry grid with hover descriptions and lightbox
- **Collections** — Curated project collections with detail views
- **Projects / About** — CV-style page with skills, education, and work history
- **AI Art Generator** — Generate images via Rod Dev Service API
- **Renders Gallery** — Filterable AI art gallery with like/favorite system

### WebGPU

- **Device support** — Adapter/device negotiation, canvas configuration,
  DPR-aware sizing and device-loss recovery, in `WebGpuLibrary` +
  `useWebGpu` / `useWebGpuFrame`
- **`WebGpuCanvasComponent`** — A canvas with a live, configured device
  behind it; it draws nothing until a renderer is passed `onFrame`
- **`/webgpu`** — Capability report for the current browser: adapter,
  features, limits, preferred canvas format

Nothing is rendered through WebGPU yet — the support layer is in place so a
renderer can be built on top of it. See [WEBGPU.md](WEBGPU.md).

### Gym Tracker

- **Exercise Journal** — Daily workout logging with sets, reps, and weight
- **Volume Tracking** — Automatic total/average calculations
- **Experience System** — Visual XP bar progression per exercise

## Quick Start

```bash
# Secrets are resolved from vault-service automatically.
npm install
npm run dev
```

## Scripts

```bash
npm run dev            # Start dev server
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
npm run lint:fix       # Auto-fix lint issues
npm run format         # Format with Prettier
npm run format:check   # Check formatting
npm test               # Run tests (Vitest)
npm run test:watch     # Run tests in watch mode
npm run deploy         # Deploy to production
npm run deploy:dry     # Validate deployment without deploying
npm run setup-ssh      # Set up SSH keys for deployment
```
