/**
 * /api/prism/* — the image tool's road to prism-service, through this
 * server.
 *
 * Prism admits only a signed-in user or a server presenting
 * PRISM_SERVICE_API_SECRET, so the browser never calls it directly.
 * What is forwarded, as whom, and why: src/libraries/PrismProxyLibrary.ts.
 */

import { proxyPrism } from "@/libraries/PrismProxyLibrary";

interface PrismRouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: Request, { params }: PrismRouteContext) {
  return proxyPrism(request, (await params).path);
}

export const POST = GET;
