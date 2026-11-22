# DAGBOEK API

Cloudflare Worker API for DAGBOEK, backed by Neon PostgreSQL through Cloudflare Hyperdrive.

## Deployed service

Worker: `dagboek-api`

- `GET /health` — Worker liveness response.
- `GET /api/ready` — confirms the Hyperdrive binding is attached to the Worker.

The current `/api/ready` check verifies the binding exists; it does not yet run a live SQL query. Database query endpoints, authentication, accounting routes, and schema migrations are not yet implemented.

## Deployment

The initial Worker deployment was performed through the authorized Cloudflare connection. Future CI/CD deployment can be configured separately if desired.

## Security

- Browser clients never receive database credentials.
- The Worker receives database connectivity only through the Hyperdrive binding.
- No accounting write endpoints are exposed in this initial deployment.
- Keep the runtime database role separate from the Neon owner role.
- Do not commit connection strings, API tokens, or passwords.
