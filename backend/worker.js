export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    if (url.pathname === "/health" && request.method === "GET") {
      return Response.json({
        ok: true,
        service: "DAGBOEK API",
        version: "1.0.0",
        status: "online"
      }, { headers });
    }

    if (url.pathname === "/api/ready" && request.method === "GET") {
      return Response.json({
        ready: Boolean(env.HYPERDRIVE),
        service: "DAGBOEK API",
        database_binding: Boolean(env.HYPERDRIVE)
      }, { status: env.HYPERDRIVE ? 200 : 503, headers });
    }

    return Response.json({
      ok: false,
      error: "not_found",
      message: "Endpoint tidak ditemukan."
    }, { status: 404, headers });
  }
};
