import postgres from "postgres";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders });

const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromBase64 = (value) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
const hex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function sha256(value) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function derivePassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" }, key, 256);
  return toBase64(bits);
}

function createDb(env) {
  if (!env.HYPERDRIVE?.connectionString) throw new Error("hyperdrive_unavailable");
  return postgres(env.HYPERDRIVE.connectionString, {
    max: 5, fetch_types: false, idle_timeout: 20, connect_timeout: 10,
    connection: { application_name: "dagboek-api" },
  });
}

async function readBody(request) {
  try { return await request.json(); } catch { return null; }
}

async function getSessionUser(request, sql) {
  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token || token.length > 256) return null;
  const tokenHash = await sha256(token);
  const rows = await sql`
    select p.id, p.email, p.nama_lengkap, p.role
    from public.auth_sessions s
    join public.profiles p on p.id = s.user_id
    where s.token_hash = ${tokenHash}
      and s.revoked_at is null and s.expires_at > now() and p.is_active = true
    limit 1
  `;
  return rows[0] || null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: jsonHeaders });

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "DAGBOEK API", version: "1.2.0", status: "online" });
    }

    let sql;
    try {
      sql = createDb(env);

      if (url.pathname === "/api/ready" && request.method === "GET") {
        return json({ ready: true, service: "DAGBOEK API", database_binding: true });
      }

      if (url.pathname === "/api/db-check" && request.method === "GET") {
        const rows = await sql`select current_database() as database, current_user as role,
          current_timestamp as checked_at,
          (select count(*)::int from information_schema.tables where table_schema = 'public') as public_tables`;
        return json({ ok: true, service: "DAGBOEK API", ...rows[0] });
      }

      if (url.pathname === "/api/auth/bootstrap" && request.method === "POST") {
        if (!env.BOOTSTRAP_SECRET) return json({ ok: false, error: "bootstrap_not_configured" }, 503);
        const body = await readBody(request);
        if (!body || body.bootstrap_secret !== env.BOOTSTRAP_SECRET) return json({ ok: false, error: "unauthorized" }, 401);
        const email = String(body.email || "").trim().toLowerCase();
        const name = String(body.nama_lengkap || "").trim();
        const password = String(body.password || "");
        if (!email.includes("@") || !name || password.length < 10) {
          return json({ ok: false, error: "invalid_input", message: "Email, nama, dan password minimal 10 karakter wajib diisi." }, 400);
        }
        const count = await sql`select count(*)::int as total from public.profiles`;
        if (count[0].total > 0) return json({ ok: false, error: "bootstrap_closed" }, 409);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const passwordHash = await derivePassword(password, salt);
        const rows = await sql`
          insert into public.profiles (email, password_hash, password_salt, nama_lengkap, role, is_active)
          values (${email}, ${passwordHash}, ${toBase64(salt)}, ${name}, 'manager', true)
          returning id, email, nama_lengkap, role
        `;
        return json({ ok: true, user: rows[0] }, 201);
      }

      if (url.pathname === "/api/auth/login" && request.method === "POST") {
        const body = await readBody(request);
        const email = String(body?.email || "").trim().toLowerCase();
        const password = String(body?.password || "");
        if (!email || !password) return json({ ok: false, error: "email_password_required" }, 400);
        const rows = await sql`select id, email, nama_lengkap, role, password_hash, password_salt, is_active
          from public.profiles where lower(email) = ${email} limit 1`;
        const user = rows[0];
        if (!user || !user.is_active || !user.password_hash || !user.password_salt) {
          return json({ ok: false, error: "invalid_credentials" }, 401);
        }
        const calculated = await derivePassword(password, fromBase64(user.password_salt));
        if (calculated !== user.password_hash) return json({ ok: false, error: "invalid_credentials" }, 401);
        const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
        const token = toBase64(tokenBytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
        const tokenHash = await sha256(token);
        await sql`insert into public.auth_sessions (user_id, token_hash, expires_at)
          values (${user.id}, ${tokenHash}, now() + interval '12 hours')`;
        return json({ ok: true, token, expires_in: 43200, user: { id: user.id, email: user.email, nama_lengkap: user.nama_lengkap, role: user.role } });
      }

      if (url.pathname === "/api/auth/session" && request.method === "GET") {
        const user = await getSessionUser(request, sql);
        return user ? json({ ok: true, user }) : json({ ok: false, error: "unauthorized" }, 401);
      }

      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        const authorization = request.headers.get("Authorization") || "";
        const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
        if (token) await sql`update public.auth_sessions set revoked_at = now()
          where token_hash = ${await sha256(token)} and revoked_at is null`;
        return json({ ok: true });
      }

      return json({ ok: false, error: "not_found", message: "Endpoint tidak ditemukan." }, 404);
    } catch (error) {
      const message = String(error?.message || error);
      const unavailable = message.includes("hyperdrive_unavailable");
      return json({ ok: false, error: unavailable ? "hyperdrive_unavailable" : "server_error",
        detail: env.ENVIRONMENT === "development" ? message : undefined }, unavailable ? 503 : 500);
    } finally {
      if (sql) await sql.end({ timeout: 1 }).catch(() => {});
    }
  },
};
