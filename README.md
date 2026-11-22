# DAIBOEK by Nusa Pixel

Sistem akuntansi koperasi desa — project turunan dari KDMP ERP Pendowo Asri.

## Status
- Base source copied from `kdmp-erp-pendowo-asri` branch `work/dagboek-stabilization-2026-11-21`.
- Current working branch: `copy/kdmp-erp-base-daiboek`.
- Branding awal: DAIBOEK by Nusa Pixel.
- Visual direction: black / deep forest green with neon green accents.

## Important: backend isolation
This repository is intentionally NOT connected to the original KDMP/DAGBOEK Supabase project.
Before running the application:
1. Create a separate Supabase project dedicated to DAIBOEK.
2. Review and adapt the SQL migrations in `supabase/migrations` for the new project.
3. Configure `SUPABASE_URL` and `SUPABASE_KEY` in `app.js` using the new project's public client key.
4. Review authentication, roles, RLS policies, storage, RPCs, and environment configuration.
5. Never copy production secrets or reuse the original KDMP database.

The app will not connect successfully until the new Supabase credentials are configured.
