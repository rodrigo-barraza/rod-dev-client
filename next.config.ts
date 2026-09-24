// ============================================================
// rod.dev — Next.js Configuration
// ============================================================
// Bootstraps secrets from Vault at startup
// and injects them into process.env for the app.
// ============================================================

import { createVaultClient } from "@rodrigo-barraza/utilities-library/node";
import type { NextConfig } from "next";

// ── Bootstrap secrets at build/dev time ────────────────────────
const vault = createVaultClient();

const secrets = vault.fetchSync();

// Inject into process.env so the app can read them
Object.assign(process.env, secrets);

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,

  // ── Response headers ──────────────────────────────────────
  // No HSTS: every .dev domain is on the browsers' HSTS preload list.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // ── Standalone trace: @swc/helpers ESM half ───────────────
  // @swc/helpers 0.5.16+ added a "module-sync" export condition
  // pointing at esm/*.js. Node 22.12+ (the image is node:26)
  // honours it on require(), so the server asks for
  //   @swc/helpers/esm/_interop_require_default.js
  // while the build-time tracer still resolves the "default"
  // branch and copies only cjs/*.cjs. The standalone image then
  // crash-loops on MODULE_NOT_FOUND. Ship the esm half too.
  // (next 16.2.6 pinned @swc/helpers 0.5.15, which has no
  // module-sync condition — that is why this only bit on 16.3.1.)
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/esm/**",
    ],
  },
  allowedDevOrigins: [],
  turbopack: {},
  transpilePackages: [
    "@rodrigo-barraza/components-library",
    "@rodrigo-barraza/utilities-library",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.rod.dev",
      },
      {
        protocol: "https",
        hostname: "api.prism.rod.dev",
      },
    ],
  },

  env: {
    // ── Service URLs ──────────────────────────────────────────
    NEXT_PUBLIC_ROD_DEV_SERVICE_URL: secrets.ROD_DEV_SERVICE_URL,
    NEXT_PUBLIC_PRISM_SERVICE_PUBLIC_URL: secrets.PRISM_SERVICE_PUBLIC_URL,

    // ── Sessions ──────────────────────────────────────────────
    SESSIONS_SERVICE_URL: secrets.SESSIONS_SERVICE_URL,
    SESSIONS_SERVICE_PUBLIC_URL: secrets.SESSIONS_SERVICE_PUBLIC_URL,
    NEXT_PUBLIC_SESSIONS_SERVICE_URL: secrets.SESSIONS_SERVICE_URL,
    NEXT_PUBLIC_SESSIONS_SERVICE_PUBLIC_URL:
      secrets.SESSIONS_SERVICE_PUBLIC_URL,

    // ── MinIO / Assets ────────────────────────────────────────
    ROD_DEV_MINIO_BUCKET_NAME: secrets.ROD_DEV_MINIO_BUCKET_NAME,
    ROD_DEV_ASSETS_MINIO_BUCKET_NAME: secrets.ROD_DEV_ASSETS_MINIO_BUCKET_NAME,
    NEXT_PUBLIC_ASSETS_PUBLIC_URL: secrets.ASSETS_PUBLIC_URL,
    NEXT_PUBLIC_ROD_DEV_MINIO_BUCKET_NAME: secrets.ROD_DEV_MINIO_BUCKET_NAME,
    NEXT_PUBLIC_ROD_DEV_ASSETS_MINIO_BUCKET_NAME:
      secrets.ROD_DEV_ASSETS_MINIO_BUCKET_NAME,

    // ── Analytics ─────────────────────────────────────────────
    // Vault secrets are one flat namespace — a bare GA_MEASUREMENT_ID
    // collided with clankerbox-client's and baked the wrong property ID.
    NEXT_PUBLIC_GA_MEASUREMENT_ID: secrets.ROD_DEV_GA_MEASUREMENT_ID,
  },
};

export default nextConfig;
