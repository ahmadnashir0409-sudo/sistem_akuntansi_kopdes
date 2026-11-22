# DAGBOEK API

Cloudflare Worker API for DAGBOEK, backed by Neon PostgreSQL through Cloudflare Hyperdrive.

## Current endpoints

- `GET /health` — Worker liveness check.
- `GET /api/ready` — confirms the Hyperdrive binding exists.
- `GET /api/v1/health/db` — runs a read-only PostgreSQL connection check and returns the database name and runtime role.

No accounting tables, authentication flows, or write endpoints are enabled yet. Those will be added only after the existing application data model and authorization rules are mapped and reviewed.

## Local development

1. Install dependencies with `npm ci`.
2. Run `npm run dev`.
3. Use a local Hyperdrive configuration or Wrangler local-development settings. Never commit a connection string.
4. Check `GET /api/v1/health/db`.

## Deployment

Run `npm ci` and `npm run deploy` from this directory after authenticating Wrangler. The Worker uses the Hyperdrive binding configured in `wrangler.jsonc`.

## Security

- Browser clients never receive database credentials.
- SQL is parameterized through the Postgres.js tagged-template API.
- The first database endpoint is read-only.
- Database errors are logged server-side; raw driver errors are not returned to clients.
- Configure `ALLOWED_ORIGINS` as a Worker variable with exact HTTPS frontend origins before enabling browser requests.
- Keep the runtime database role separate from the Neon owner role.
