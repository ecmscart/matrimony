import { NextRequest } from "next/server";
import { config } from "@/lib/config";

/**
 * Same-origin image proxy.
 *
 * Profile photos are stored as absolute URLs on the bureau's uploads host
 * (and served without CORS headers). The client-side PDF generator needs to
 * read the image bytes, which a cross-origin `fetch` cannot do. This route
 * fetches the image server-side and streams it back from our own origin so
 * the PDF generator can embed it.
 *
 * Only a small allowlist of hosts may be proxied to avoid SSRF.
 */

function allowedHosts(): Set<string> {
  const hosts = new Set<string>();
  try {
    hosts.add(new URL(config.apiOrigin).host);
  } catch {
    // ignore malformed origin
  }
  // Known production uploads host.
  hosts.add("maher.mahershadi.com");
  return hosts;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return new Response("Unsupported protocol", { status: 400 });
  }

  if (!allowedHosts().has(target.host)) {
    return new Response("Host not allowed", { status: 403 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString());
  } catch {
    return new Response("Failed to fetch image", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("Upstream returned an error", { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const looksLikeImage =
    contentType.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif|bmp|heic|heif)(\?|$)/i.test(target.pathname);
  if (!looksLikeImage && contentType && !contentType.includes("octet-stream")) {
    return new Response("Not an image", { status: 415 });
  }

  const body = await upstream.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType.startsWith("image/")
        ? contentType
        : "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
