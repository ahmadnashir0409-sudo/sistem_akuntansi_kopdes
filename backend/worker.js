/**
 * DAIBOEK API — Cloudflare Workers
 *
 * Database access is intentionally gated until the Neon connection is
 * attached through a Cloudflare Hyperdrive binding named HYPERDRIVE.
 * Never put Neon credentials in browser code or commit them to Git.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "DAIBOEK API",
        backend: "Cloudflare Workers",
        database: env.HYPERDRIVE ? "neon-binding-configured" : "not-configured",
      }, { headers: corsHeaders(request) });
    }

    if (url.pathname === "/api/ready") {
      const ready = Boolean(env.HYPERDRIVE);
      return Response.json({
        ready,
        service: "DAIBOEK API",
        database: ready ? "binding-present" : "awaiting-hyperdrive",
      }, {
        status: ready ? 200 : 503,
        headers: corsHeaders(request),
      });
    }

    return Response.json({
      error: "not_found",
      message: "Endpoint belum tersedia.",
    }, { status: 404, headers: corsHeaders(request) });
  },
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const allowed = new Set([
    "http://localhost:5500",
    "http://127.0.0.1:5500",
  ]);
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  });
  if (allowed.has(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}
