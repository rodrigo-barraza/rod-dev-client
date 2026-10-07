import { afterEach, describe, expect, it, vi } from "vitest";
import RenderApiLibrary from "@/libraries/RenderApiLibrary";

// The browser never calls prism-service itself: Prism refuses anyone
// without a login or the service secret, so every call goes same-origin
// to this site's /api/prism relay, which adds the secret server-side.

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RenderApiLibrary — Prism through /api/prism", () => {
  it("renders through the relay, sending only the prompt and the visitor", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            images: [{ minioRef: "minio://prism/renders/fox.png" }],
            provider: "openai",
            model: "gpt-image",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await RenderApiLibrary.postRender(
      "a fox",
      "euler",
      7,
      "watercolor",
      "",
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/prism/chat");
    const headers = new Headers(init?.headers);
    expect(headers.get("x-username")).toBe("anonymous");
    expect(headers.get("x-api-secret")).toBeNull();
    expect(JSON.parse(String(init?.body))).toEqual({
      messages: [{ role: "user", content: "a fox, watercolor style" }],
    });
    // The image is served same-origin, through the relay, too.
    expect(result.data.image).toBe("/api/prism/files/renders/fox.png");
  });

  it("checks Prism's health through the relay", async () => {
    const fetchMock = vi.fn(
      async (_url: string) =>
        new Response(JSON.stringify({ status: "ok" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(RenderApiLibrary.getStatus()).resolves.toEqual({
      data: { status: "ok" },
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/prism/health");
  });
});
