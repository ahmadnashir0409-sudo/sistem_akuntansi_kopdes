# DAGBOEK by Nusa Pixel

ERP akuntansi dan operasional koperasi, dipisahkan dari sistem produksi KDMP.

## Arsitektur target
- Frontend: Cloudflare Pages
- API: Cloudflare Worker `dagboek-api`
- Database: Neon PostgreSQL melalui Cloudflare Hyperdrive
- Database produksi KDMP/Supabase tidak digunakan oleh DAGBOEK.

## Status migrasi
- Salinan frontend dasar dan branding DAGBOEK tersedia.
- Migrasi skema 30 tabel KDMP tersimpan di `backend/migrations/0003_full_kdmp_schema.sql`.
- Skema diterapkan ke database Neon DAGBOEK; tidak ada data produksi yang disalin.
- Worker memiliki endpoint health, database check, dan autentikasi awal.
- **Belum siap produksi:** frontend masih menggunakan Supabase JS dan placeholder credentials; lapisan data API Worker/Postgres, RPC, trigger, dan uji end-to-end seluruh modul masih harus diselesaikan.

## Keamanan
- Jangan menghubungkan DAGBOEK ke database produksi KDMP.
- Jangan menaruh kredensial Neon/Hyperdrive di frontend.
- Gunakan role runtime `dagboek_app`; migrasi DDL dilakukan oleh role owner.
- Simpan rahasia bootstrap sebagai Worker secret, bukan di repository.
