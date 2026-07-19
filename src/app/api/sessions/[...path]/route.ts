/**
 * Catch-all API proxy for sessions-service.
 * Forwards requests from /api/sessions/[...path] → sessions-service/[path].
 *
 * Forwards client identity headers (IP, User-Agent, client hints,
 * Accept-Language, Referer) so sessions-service can perform accurate IP
 * geolocation and device fingerprinting.
 */

import { createNextjsProxy } from "@rodrigo-barraza/utilities-library/nextjs";
import { IDENTITY_HEADERS } from "@rodrigo-barraza/utilities-library/taxonomy";

export const { GET, POST } = createNextjsProxy({
  serviceName: "sessions",
  publicUrlEnvironmentVariable: "SESSIONS_SERVICE_PUBLIC_URL",
  internalUrlEnvironmentVariable: "SESSIONS_SERVICE_URL",
  forwardHeaders: [
    IDENTITY_HEADERS.forwardedFor,
    "x-real-ip",
    "user-agent",
    "x-session-id",
    "accept-language",
    "referer",
    "sec-ch-ua",
    "sec-ch-ua-mobile",
    "sec-ch-ua-platform",
    "sec-ch-ua-platform-version",
    "sec-ch-ua-model",
  ],
  methods: ["GET", "POST"],
});
