/**
 * Catch-all API proxy for sessions-service.
 * Forwards requests from /api/sessions/[...path] → sessions-service/[path].
 *
 * Forwards client identity headers (IP, User-Agent, Accept-Language) so
 * sessions-service can perform accurate IP geolocation and device fingerprinting.
 */

import { createNextjsProxy } from "@rodrigo-barraza/utilities-library/nextjs";

export const { GET, POST } = createNextjsProxy({
  port: 5580,
  serviceName: "sessions",
  publicUrlEnvironmentVariable: "SESSIONS_SERVICE_PUBLIC_URL",
  internalUrlEnvironmentVariable: "SESSIONS_SERVICE_URL",
  forwardHeaders: [
    "x-forwarded-for",
    "x-real-ip",
    "user-agent",
    "x-session-id",
    "accept-language",
  ],
  methods: ["GET", "POST"],
});
