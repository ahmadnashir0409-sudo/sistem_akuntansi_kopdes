import postgres from "postgres";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "DAGBOEK API", version: "1.1.0", status: "online" });
    }

    if (url.pathname === "/api/ready" && request.method === "GET") {
      const ready = Boolean(env.HYPERDRIVE?.connectionString);
      return json({ ready, service: "DAGBOEK API", database_binding: ready }, ready ? 200 : 503);
    }

    if (url.pathname === "/api/db-check" && request.method === "GET") {
      if (!env.HYPERDRIVE?.connectionString) {
        return json({ ok: false, error: "hyperdrive_unavailable" }, 503);
      }
      let sql;
      try {
        sql = postgres(env.HYPERDRIVE.connectionString, {
          max: 5,
          fetch_types: false,
          idle_timeout: 20,
          connect_timeout: 10,
          connection: { application_name: "dagboek-api" },
        });
        const rows = await sql`select current_database() as database,
          current_user as role,
          current_timestamp as checked_at,
          (select count(*)::int from information_schema.tables where table_schema = 'public') as public_tables`;
        return json({
          ok: true,
          service: "DAGBOEK API",
          database: rows[0].database,
          role: rows[0].role,
          public_tables: rows[0].public_tables,
          checked_at: rows[0].checked_at,
        });
      } catch (error) {
        return json({
          ok: false,
          error: "database_connection_failed",
          detail: String(error?.message || error),
        }, 503);
      } finally {
        if (sql) await sql.end({ timeout: 1 }).catch(() => {});
      }
    }

    return json({ ok: false, error: "not_found", message: "Endpoint tidak ditemukan." }, 404);
  },
};
