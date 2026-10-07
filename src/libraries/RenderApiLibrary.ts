import FetchWrapper from "@/wrappers/FetchWrapper";
import ApiConstants from "@/constants/ApiConstants";
import { IDENTITY_HEADERS } from "@rodrigo-barraza/utilities-library/taxonomy";

const SERVICE_URL = ApiConstants.RENDER_SERVICE;

/**
 * Prism, through this site's server: it adds the service secret Prism
 * requires and pins the image model (GPT Image) and the project
 * (PrismProxyLibrary's RENDER_PRISM), so the browser sends only the prompt.
 */
const PRISM_API = ApiConstants.PRISM_API;

const RenderApiLibrary = {
  /**
   * Generate an image via Prism's /chat endpoint with an image API model.
   *
   * Sends the user's prompt, enriched by the selected style, to Prism's
   * non-streaming /chat. Returns the full JSON response containing the
   * image (base64 data or a MinIO ref) and metadata.
   */
  async postRender(
    prompt: string,
    sampler: string,
    config: number,
    style: string,
    negativePrompt: string,
    aspectRatio?: string,
  ): Promise<{
    data: {
      id: string;
      image: string | null;
      prompt: string;
      style: string;
      sampler: string;
      config: number;
      count: number;
      createdAt: string;
      aspectRatio: string;
      provider?: string;
      model?: string;
      estimatedCost?: number;
    };
  }> {
    // Build an enriched prompt that incorporates the style modifier
    let enrichedPrompt = prompt;
    if (style) {
      enrichedPrompt = `${prompt}, ${style} style`;
    }

    const url = `${PRISM_API}/chat`;
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        [IDENTITY_HEADERS.username]: "anonymous",
      };

      // Thread session/local IDs for tracking
      if (typeof window !== "undefined") {
        if (sessionStorage.id)
          headers[IDENTITY_HEADERS.username] = sessionStorage.id;
      }

      const body = {
        messages: [
          {
            role: "user",
            content: enrichedPrompt,
          },
        ],
      };

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Normalize the Prism response into the shape Txt2ImageComponent expects:
      // { data: { id, image, prompt, style, sampler, cfg, count, createdAt, aspectRatio } }
      const imageData = result.images?.[0];

      // MinIO refs (minio://bucket/key) are served by Prism's /files/
      // endpoint, reached same-origin through the relay.
      let imageUrl: string | null = null;
      if (imageData?.minioRef) {
        const key = imageData.minioRef.replace(/^minio:\/\/[^/]+\//, "");
        imageUrl = `${PRISM_API}/files/${key}`;
      } else if (imageData?.data) {
        imageUrl = `data:${imageData.mimeType || "image/png"};base64,${imageData.data}`;
      }

      const id = crypto.randomUUID();

      return {
        data: {
          id,
          image: imageUrl,
          prompt,
          style: style || "",
          sampler: sampler || "",
          config: config || 7,
          count: Date.now(),
          createdAt: new Date().toISOString(),
          aspectRatio: aspectRatio || "square",
          // Prism metadata
          provider: result.provider,
          model: result.model,
          estimatedCost: result.estimatedCost,
        },
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async getRenders(limit?: string, mode?: string) {
    const params: Record<string, string> = {};
    if (limit) params.limit = limit;
    if (mode) params.mode = mode;
    return FetchWrapper.get(SERVICE_URL, "renders", params);
  },

  async getLikedRenders(limit?: string) {
    const params: Record<string, string> = {};
    if (limit) params.limit = limit;
    return FetchWrapper.get(SERVICE_URL, "likes", params);
  },

  async getRender(id?: string) {
    const params: Record<string, string> = {};
    if (id) params.id = id;
    return FetchWrapper.get(SERVICE_URL, "render", params);
  },

  async deleteRender(id?: string) {
    const body: Record<string, string> = {};
    if (id) body.id = id;
    return FetchWrapper.del(SERVICE_URL, "render", body);
  },

  async getCount() {
    return FetchWrapper.get(SERVICE_URL, "count");
  },

  /**
   * Check if Prism is available by hitting its /health endpoint.
   */
  async getStatus() {
    try {
      const response = await fetch(`${PRISM_API}/health`);
      if (response.ok) {
        const data = await response.json();
        return { data };
      }
      return { data: null };
    } catch {
      return { data: null };
    }
  },
};

export default RenderApiLibrary;
