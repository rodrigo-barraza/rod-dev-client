import ApiConstants from "@/constants/ApiConstants";

const FetchWrapper = {
  /**
   * Build a full service URL from a service constant and path segment.
   */
  _buildUrl(service: string, path: string): string {
    return `${ApiConstants.ROD_DEV_SERVICE_URL}${service}/${path}`;
  },

  /**
   * Low-level fetch wrapper — merges headers, appends search params,
   * conditionally stringifies body. Returns `{ data, error, response }`.
   */
  async fetch(
    method: string,
    url: string,
    headers: Headers,
    body: object,
    searchParams: URLSearchParams,
  ) {
    let data, error, response;
    try {
      const mergedHeaders = new Headers({
        "Content-Type": "application/json",
      });

      for (const [key, value] of headers.entries()) {
        mergedHeaders.append(key, value);
      }

      const mergedUrl = `${url}?${searchParams.toString()}`;
      response = await fetch(mergedUrl, {
        method: method,
        headers: mergedHeaders,
        body: Object.keys(body).length ? JSON.stringify(body) : undefined,
      });

      if (response.ok) {
        const result = await response.text();
        const parsedResult = JSON.parse(result);
        data = parsedResult.data || parsedResult;
      } else {
        error = response;
      }
    } catch (error) {
      error = error;
    }
    return { data, error, response };
  },

  // ─── Convenience Methods ─────────────────────────────────────

  /**
   * GET request with optional query params and headers.
   */
  async get(
    service: string,
    path: string,
    params?: Record<string, string>,
    headers?: Record<string, string>,
  ) {
    const url = this._buildUrl(service, path);
    const searchParams = new URLSearchParams(params || {});
    const requestHeaders = new Headers(headers || {});
    return this.fetch("GET", url, h, {}, searchParams);
  },

  /**
   * POST request with optional JSON body and headers.
   */
  async post(
    service: string,
    path: string,
    body?: Record<string, string>,
    headers?: Record<string, string>,
  ) {
    const url = this._buildUrl(service, path);
    const requestHeaders = new Headers(headers || {});
    return this.fetch("POST", url, h, body || {}, new URLSearchParams({}));
  },

  /**
   * DELETE request with optional JSON body.
   */
  async del(service: string, path: string, body?: Record<string, string>) {
    const url = this._buildUrl(service, path);
    return this.fetch(
      "DELETE",
      url,
      new Headers({}),
      body || {},
      new URLSearchParams({}),
    );
  },
};

export default FetchWrapper;
