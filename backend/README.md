# DAIBOEK backend setup

## Provisioned resources
- Neon project: `daiboek-nusa-pixel`
- Neon project ID: `fancy-art-79318392`
- Neon region: `aws-ap-southeast-1` (Singapore)
- Neon branch: `main`
- Database: `daiboek`
- PostgreSQL: 17
- Cloudflare Worker: `daiboek-api`
- Cloudflare account ID is intentionally not stored in this repository.

## Security boundary
- The browser must never connect directly to Neon.
- Neon credentials must never be committed or exposed in frontend JavaScript.
- Use Cloudflare Hyperdrive binding `HYPERDRIVE` for PostgreSQL access.
- Use a dedicated, least-privilege database role for the Worker rather than the owner role after initial provisioning.
- Supabase production project and its data remain untouched.

## Remaining manual connection step
Create a Hyperdrive configuration in the Cloudflare dashboard using the Neon connection details, disable query caching for this transactional accounting database, then bind its ID to Worker `daiboek-api` under binding name `HYPERDRIVE`.

After the binding is attached, implement and test the API endpoints and migrate the database schema. The existing Supabase migrations must be reviewed and adapted; they are not safe to blindly apply to Neon because Supabase Auth helpers and platform-specific objects are not present in a plain Neon project.

## Current status
The Worker is a health/readiness scaffold only. It is not yet an operational accounting API. The Neon database is provisioned and verified as PostgreSQL 17; application tables have not been migrated.
