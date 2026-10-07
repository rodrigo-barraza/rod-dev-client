import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RENDER_PRISM, proxyPrism } from "@/libraries/PrismProxyLibrary";
import { GET, POST } from "@/app/api/prism/[...path]/route";

// The image tool reaches prism-service only through /api/prism, which
// adds the service secret server-side. With the secret, whatever it
// forwards is a trusted service call, so it must forward the image tool
// and nothing else.

const PRISM_URL = "http://prism.test:7777";
const SECRET = "test-service-secret";
const VISITOR = "0f8e2a8c-3b1d-4c7e-9a52-6d1e8b4f2c90";

interface UpstreamCall {
  url: string;
  init: RequestInit;
  headers: Headers;
  body: Record<string, unknown> | null;
}

function jsonUpstream(): Response {
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

/** Stub fetch (prism-service) and record what reaches it. */
function stubUpstream(respond: () => Response = jsonUpstream): UpstreamCall[] {
  const calls: UpstreamCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      calls.push({
        url,
        init,
        headers: new Headers(init.headers),
        body: typeof init.body === "string" ? JSON.parse(init.body) : null,
      });
      return respond();
    }),
  );
  return calls;
}

/** A browser's POST /api/prism/chat, trying everything it should not get. */
function chatRequest(body: unknown, username = "rodrigo"): Request {
  return new Request(
    "http://rod.test/api/prism/chat?project=prism-client&stream=true",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-project": "prism-client",
        "x-username": username,
        "x-workspace-root": "/home/rodrigo",
        "x-forwarded-for": "203.0.113.7",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    },
  );
}

const prompt = {
  messages: [{ role: "user", content: "a fox, watercolor style" }],
};

beforeEach(() => {
  vi.stubEnv("PRISM_SERVICE_URL", PRISM_URL);
  vi.stubEnv("PRISM_SERVICE_API_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("proxyPrism — POST /api/prism/chat", () => {
  it("renders with the service secret, the pinned model and project", async () => {
    const calls = stubUpstream();
    const request = chatRequest({
      ...prompt,
      provider: "anthropic",
      model: "an-expensive-model",
      skipConversation: false,
      workspaceRoot: "/home/rodrigo",
      autoApprove: true,
    });

    const response = await proxyPrism(request, ["chat"]);

    expect(response.status).toBe(200);
    expect(calls).toHaveLength(1);
    // The browser's query never reaches Prism (it reads project from it).
    expect(calls[0].url).toBe(`${PRISM_URL}/chat?stream=false`);
    expect(calls[0].headers.get("x-api-secret")).toBe(SECRET);
    expect(calls[0].headers.get("x-project")).toBe("rod-dev-client");
    expect(calls[0].headers.get("x-workspace-root")).toBeNull();
    expect(calls[0].headers.get("x-forwarded-for")).toBe("203.0.113.7");
    expect(calls[0].body).toEqual({
      provider: RENDER_PRISM.provider,
      model: RENDER_PRISM.model,
      messages: prompt.messages,
      skipConversation: true,
    });
    expect(calls[0].init.signal).toBe(request.signal);
  });

  it("passes on a visitor's own id, and nobody else's name", async () => {
    const calls = stubUpstream();
    for (const claimed of [VISITOR, "rodrigo", "admin", "anonymous", ""]) {
      await proxyPrism(chatRequest(prompt, claimed), ["chat"]);
    }
    expect(calls.map((call) => call.headers.get("x-username"))).toEqual([
      VISITOR,
      "anonymous",
      "anonymous",
      "anonymous",
      "anonymous",
    ]);
  });

  it("refuses anything but one user prompt, without calling Prism", async () => {
    const calls = stubUpstream();
    for (const body of [
      "{not json",
      {},
      { messages: [] },
      { messages: [{ role: "assistant", content: "draw a fox" }] },
      { messages: [{ role: "user", content: "   " }] },
      { messages: [{ role: "user", content: ["a fox"] }] },
      { messages: [prompt.messages[0], prompt.messages[0]] },
    ]) {
      const response = await proxyPrism(chatRequest(body), ["chat"]);
      expect(response.status).toBe(400);
    }
    const oversized = await proxyPrism(
      chatRequest({
        messages: [{ role: "user", content: "x".repeat(70 * 1024) }],
      }),
      ["chat"],
    );
    expect(oversized.status).toBe(413);
    expect(calls).toHaveLength(0);
  });
});

describe("proxyPrism — health and files", () => {
  it("answers the health check through Prism", async () => {
    const calls = stubUpstream();
    const response = await proxyPrism(
      new Request("http://rod.test/api/prism/health"),
      ["health"],
    );
    expect(await response.json()).toEqual({ status: "ok" });
    expect(calls[0].url).toBe(`${PRISM_URL}/health`);
    expect(calls[0].headers.get("x-api-secret")).toBe(SECRET);
  });

  it("serves a rendered image from Prism's file endpoint", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const calls = stubUpstream(
      () =>
        new Response(png, {
          status: 200,
          headers: {
            "content-type": "image/png",
            "cache-control": "public, max-age=31536000",
          },
        }),
    );
    const response = await proxyPrism(
      new Request("http://rod.test/api/prism/files/renders/a%20fox.png"),
      ["files", "renders", "a fox.png"],
    );
    expect(calls[0].url).toBe(`${PRISM_URL}/files/renders/a%20fox.png`);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=31536000",
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(png);
  });

  it("forwards nothing the image tool does not use", async () => {
    const calls = stubUpstream();
    for (const [method, segments] of [
      ["GET", ["chat"]],
      ["POST", ["agent"]],
      ["POST", ["health"]],
      ["GET", ["conversations"]],
      ["GET", ["admin", "users"]],
      ["GET", ["files"]],
      ["GET", ["files", "..", "settings"]],
      ["GET", ["files", ".", "x.png"]],
      ["POST", ["files", "x.png"]],
    ] as const) {
      const response = await proxyPrism(
        new Request(`http://rod.test/api/prism/${segments.join("/")}`, {
          method,
          ...(method === "POST" && { body: JSON.stringify(prompt) }),
        }),
        [...segments],
      );
      expect(response.status).toBe(404);
    }
    expect(calls).toHaveLength(0);
  });

  it("is unavailable, never redirected, when Prism's URL is unset", async () => {
    vi.stubEnv("PRISM_SERVICE_URL", "");
    const calls = stubUpstream();
    const response = await proxyPrism(chatRequest(prompt), ["chat"]);
    expect(response.status).toBe(503);
    expect(calls).toHaveLength(0);
  });

  it("answers Prism's outage with a 502", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await proxyPrism(chatRequest(prompt), ["chat"]);
    expect(response.status).toBe(502);
  });
});

describe("/api/prism/[...path] route handler", () => {
  it("hands GET and POST to the proxy with the path after /api/prism", async () => {
    const calls = stubUpstream();
    await GET(new Request("http://rod.test/api/prism/health"), {
      params: Promise.resolve({ path: ["health"] }),
    });
    await POST(chatRequest(prompt, VISITOR), {
      params: Promise.resolve({ path: ["chat"] }),
    });
    expect(calls.map((call) => call.url)).toEqual([
      `${PRISM_URL}/health`,
      `${PRISM_URL}/chat?stream=false`,
    ]);
  });
});
