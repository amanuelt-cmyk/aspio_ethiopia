import handler from "vinext/server/app-router-entry";
import { englishOnlyPath } from "../lib/english-only";

function secure(response: Response, request: Request) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  if (new URL(request.url).protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

const worker = {
  async fetch(
    request: Request,
    env: Parameters<typeof handler.fetch>[1],
    context: Parameters<typeof handler.fetch>[2],
  ) {
    const url = new URL(request.url);
    const redirectPath = englishOnlyPath(url.pathname);
    if (redirectPath) {
      url.pathname = redirectPath;
      return secure(Response.redirect(url.toString(), 307), request);
    }
    return secure(await handler.fetch(request, env, context), request);
  },
};

export default worker;
