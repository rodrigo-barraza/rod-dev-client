// ============================================================
// Client — Standalone Boot Script
// ============================================================
// CANONICAL COPY: deploy-kit/templates/client-boot.js
// deploy-kit/lib.sh syncs this file into each client repo as
// boot.js before every Docker build — edit it HERE, not in the
// client repos.
//
// Bootstraps secrets from Vault into process.env before
// starting the Next.js standalone server. In standalone mode,
// next.config does NOT run at startup, so runtime secrets
// (service URLs, auth credentials) must be fetched here.
// Uses only Node.js built-ins — no external dependencies.
//
// Required env vars (from .env.deploy → Docker .env):
//   VAULT_SERVICE_URL    — e.g. http://localhost:5599
//   VAULT_SERVICE_TOKEN  — bearer token for the vault service
// ============================================================

const VAULT_URL = process.env.VAULT_SERVICE_URL;
const VAULT_TOKEN = process.env.VAULT_SERVICE_TOKEN;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2_000;

async function fetchVaultSecrets(attempt = 1) {
  try {
    const res = await fetch(`${VAULT_URL}/secrets`, {
      headers: { Authorization: `Bearer ${VAULT_TOKEN}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    }

    const secrets = await res.json();
    let injected = 0;

    for (const [key, value] of Object.entries(secrets)) {
      if (process.env[key] === undefined || process.env[key] === "") {
        process.env[key] = value;
        injected++;
      }
    }

    console.log(
      `🔐 Vault → injected ${injected} secrets (${Object.keys(secrets).length} total)`,
    );
    return true;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * attempt;
      console.warn(
        `⚠️  Vault attempt ${attempt}/${MAX_RETRIES} failed (${error.message}) — retrying in ${delay}ms…`,
      );
      await new Promise((r) => setTimeout(r, delay));
      return fetchVaultSecrets(attempt + 1);
    }
    console.error(
      `❌ Vault unreachable after ${MAX_RETRIES} attempts (${error.message}) — continuing with env vars only`,
    );
    return false;
  }
}

async function bootstrap() {
  if (VAULT_URL && VAULT_TOKEN) {
    await fetchVaultSecrets();
  } else {
    console.warn("⚠️  No VAULT_SERVICE_URL/TOKEN — skipping vault bootstrap");
  }

  // Start the Next.js standalone server
  await import("./server.js");
}

bootstrap();
