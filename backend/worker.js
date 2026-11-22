import postgres from "postgres";

const API_VERSION = "v1";
const MAX_BODY_BYTES = 16 * 1024;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();
    const cors = corsHeaders(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/health") {
      return json({ ok: true, service: "DAGBOEK API", version: API_VERSION }, 200, cors);
    }

    if (url.pathname === "/api/ready") {
      return json({
        ready: Boolean(env.HYPERDRIVE),
        service: "DAGBOEK API",
        database_binding: Boolean(env.HYPERDRIVE),
      }, env.HYPERDRIVE ? 200 : 503, cors);
    }

    if (url.pathname === "/api/v1/health/db" && request.method === "GET") {
      if (!env.HYPERDRIVE?.connectionString) {
        return json({ ok: false, error: "database_not_configured", request_id: requestId }, 503, cors);
      }

      const sql = postgres(env.HYPERDRIVE.connectionString, {
        max: 5,
        fetch_types: false,
        connection: { application_name: "DAGBOEK API" },
      });

      try {
        const [result] = await sql`SELECT current_database() AS database, current_user AS role, current_timestamp AS checked_at`;
        return json({
          ok: true,
          service: "DAGBOEK API",
          database: "connected",
          database_name: result.database,
          application_role: result.role,
          checked_at: result.checked_at,
          request_id: requestId,
        }, 200, cors);
      } catch (error) {
        console.error(JSON.stringify({
          level: "error",
          event: "database_health_check_failed",
          request_id: requestId,
          message: error instanceof Error ? error.message : "unknown_error",
        }));
        return json({ ok: false, error: "database_connection_failed", request_id: requestId }, 503, cors);
      } finally {
        await sql.end({ timeout: 1 }).catch(() => {});
      }
    }

    return json({
      ok: false,
      error: "not_found",
      message: "Endpoint tidak ditemukan.",
      request_id: requestId,
    }, 404, cors);
  },
};

function json(payload, status, headers) {
  return Response.json(payload, {
    status,
    headers: { ...Object.fromEntries(headers), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const configured = (env.ALLOWED_ORIGINS || "http://localhost:5500,http://127.0.0.1:5500")
    .split(",").map((value) => value.trim()).filter(Boolean);
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-ID",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Cache-Control": "no-store",
  });
  if (configured.includes(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}
