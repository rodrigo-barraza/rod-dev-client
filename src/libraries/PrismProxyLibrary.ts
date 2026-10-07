// ============================================================
// Prism Proxy — the image tool's only road to prism-service
// ============================================================
// prism-service refuses a request that is neither a signed-in user
// nor a server presenting PRISM_SERVICE_API_SECRET. The image tool
// runs in visitors' browsers, so it calls this server (/api/prism/*),
// which forwards to prism-service with the secret. The secret and
// Prism's URL are read from the server's environment on every request
// and never reach a browser bundle.
//
// It is not a pass-through: with the secret, whatever it forwards is
// a trusted service call. It forwards only what the image tool uses
// (GET /health, POST /chat, GET /files/*), and pins the model and the
// project, so a visitor can render an image and nothing else. The
// browser's query string is never forwarded either: Prism reads the
// project from it before any header.
// ============================================================

import {
  AUTH_HEADERS,
  IDENTITY_HEADERS,
  MODEL_IDS,
} from "@rodrigo-barraza/utilities-library/taxonomy";

/** What the image tool runs as and on — fixed here, never sent by the browser. */
export const RENDER_PRISM = {
  project: "rod-dev-client",
  // GPT Image (OpenAI's dedicated image API model).
  provider: "openai",
  model: MODEL_IDS.gptImage,
} as const;

// A visitor speaks for itself only: the per-visitor id the page sends
// (a session UUID) is passed on, and any other name ("rodrigo",
// "admin") is not this site's to claim and becomes "anonymous".
const VISITOR_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ANONYMOUS = "anonymous";

// Request headers passed on: what the browser accepts, and who the
// visitor is to Prism's request log (it reads the first x-forwarded-for
// entry as the client IP).
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "user-agent",
  IDENTITY_HEADERS.forwardedFor,
  "x-real-ip",
];

// Response headers passed back. Never content-length or
// content-encoding: fetch has already decoded the body.
const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "cache-control",
  "x-accel-buffering",
];

// A prompt, enriched with a style — anything near this is not one.
const MAX_BODY_BYTES = 64 * 1024;

interface ProxyRoute {
  /** Path (and query) on prism-service. */
  upstream: string;
  /** Builds the body Prism receives from the browser's JSON, or null to refuse it. */
  body?: (input: unknown) => Record<string, unknown> | null;
}

/** The /chat body: the browser's one prompt, everything else pinned. */
function renderBody(input: unknown): Record<string, unknown> | null {
  const messages = (input as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages) || messages.length !== 1) return null;
  const { role, content } = (messages[0] ?? {}) as Record<string, unknown>;
  if (role !== "user" || typeof content !== "string" || !content.trim()) {
    return null;
  }
  return {
    provider: RENDER_PRISM.provider,
    model: RENDER_PRISM.model,
    messages: [{ role: "user", content }],
    skipConversation: true,
  };
}

/** A path segment that cannot climb out of /files. */
function isPlainSegment(segment: string): boolean {
  return segment !== "" && segment !== "." && segment !== "..";
}

/** What `METHOD /api/prism/<segments>` forwards, or null (a 404). */
function resolveRoute(method: string, segments: string[]): ProxyRoute | null {
  const [head, ...rest] = segments;
  if (method === "GET" && head === "health" && rest.length === 0) {
    return { upstream: "/health" };
  }
  if (method === "POST" && head === "chat" && rest.length === 0) {
    return { upstream: "/chat?stream=false", body: renderBody };
  }
  // A rendered image (a MinIO ref), served by Prism's file endpoint.
  if (
    method === "GET" &&
    head === "files" &&
    rest.length > 0 &&
    rest.every(isPlainSegment)
  ) {
    return { upstream: `/files/${rest.map(encodeURIComponent).join("/")}` };
  }
  return null;
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** The request body as text, or null once it passes `limit` bytes. */
async function readBodyText(
  request: Request,
  limit: number,
): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

/** Prism's response, streamed back as it arrives. */
function relayResponse(upstream: Response): Response {
  const headers = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (headers.get("content-type")?.startsWith("text/event-stream")) {
    // no-transform keeps Next's gzip (and any proxy) from holding frames.
    headers.set("cache-control", "no-cache, no-transform");
    headers.set("x-accel-buffering", "no");
  }
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

/** Forward one /api/prism/* request (`segments` = the path after /api/prism). */
export async function proxyPrism(
  request: Request,
  segments: string[],
): Promise<Response> {
  const route = resolveRoute(request.method, segments);
  if (!route) return jsonResponse({ error: "Not found" }, 404);

  // Never derived from the request: the secret goes to this URL only.
  const prismUrl = process.env.PRISM_SERVICE_URL;
  if (!prismUrl) {
    return jsonResponse({ error: "Prism is not configured" }, 503);
  }

  let body: string | undefined;
  if (route.body) {
    const text = await readBodyText(request, MAX_BODY_BYTES);
    if (text === null) {
      return jsonResponse({ error: "Request body too large" }, 413);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
    const upstreamBody = route.body(parsed);
    if (!upstreamBody) return jsonResponse({ error: "Invalid request" }, 400);
    body = JSON.stringify(upstreamBody);
  }

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const claimed = request.headers.get(IDENTITY_HEADERS.username) ?? "";
  headers.set(IDENTITY_HEADERS.project, RENDER_PRISM.project);
  headers.set(
    IDENTITY_HEADERS.username,
    VISITOR_ID.test(claimed) ? claimed : ANONYMOUS,
  );
  const secret = process.env.PRISM_SERVICE_API_SECRET;
  if (secret) headers.set(AUTH_HEADERS.apiSecret, secret);
  if (body !== undefined) headers.set("content-type", "application/json");

  let upstream: Response;
  try {
    upstream = await fetch(`${prismUrl.replace(/\/+$/, "")}${route.upstream}`, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      // A visitor who leaves closes the upstream call too.
      signal: request.signal,
    });
  } catch (error: unknown) {
    if (!request.signal.aborted) {
      console.error(
        `[Prism Proxy] ${request.method} ${route.upstream} failed:`,
        error instanceof Error ? error.message : String(error),
      );
    }
    return jsonResponse({ error: "Prism is unreachable" }, 502);
  }
  return relayResponse(upstream);
}
