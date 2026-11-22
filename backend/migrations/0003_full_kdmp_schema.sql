-- DAGBOEK schema migration generated from KDMP source metadata.
-- Schema only: no production rows copied. Supabase auth.users references are mapped to isolated public.app_users.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS public.app_users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text UNIQUE NOT NULL,
 password_hash text,
 email_confirmed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."profiles" (
 "id" uuid NOT NULL,
 "nama_lengkap" text NOT NULL,
 "role" text DEFAULT 'kasir'::text NOT NULL CHECK (role = ANY (ARRAY['manajer'::text, 'admin_keuangan'::text, 'kasir'::text, 'admin_gudang'::text, 'pengurus'::text])),
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "id" uuid NOT NULL;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "nama_lengkap" text NOT NULL;
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'kasir'::text NOT NULL CHECK (role = ANY (ARRAY['manajer'::text, 'admin_keuangan'::text, 'kasir'::text, 'admin_gudang'::text, 'pengurus'::text]));
ALTER TABLE public."profiles" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."accounts" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "kode_akun" text NOT NULL UNIQUE,
 "nama_akun" text NOT NULL,
 "kategori" text NOT NULL CHECK (kategori = ANY (ARRAY['aset'::text, 'kewajiban'::text, 'ekuitas'::text, 'pendapatan'::text, 'beban'::text])),
 "saldo_normal" text NOT NULL CHECK (saldo_normal = ANY (ARRAY['debit'::text, 'kredit'::text])),
 "aktif" boolean DEFAULT true NOT NULL,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "kode_akun" text NOT NULL UNIQUE;
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "nama_akun" text NOT NULL;
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "kategori" text NOT NULL CHECK (kategori = ANY (ARRAY['aset'::text, 'kewajiban'::text, 'ekuitas'::text, 'pendapatan'::text, 'beban'::text]));
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "saldo_normal" text NOT NULL CHECK (saldo_normal = ANY (ARRAY['debit'::text, 'kredit'::text]));
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "aktif" boolean DEFAULT true NOT NULL;
ALTER TABLE public."accounts" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."journal_entries" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "nomor_jurnal" text NOT NULL UNIQUE,
 "tanggal" date DEFAULT CURRENT_DATE NOT NULL,
 "keterangan" text NOT NULL,
 "status" text DEFAULT 'draft'::text NOT NULL CHECK (status = ANY (ARRAY['draft'::text, 'posted'::text, 'cancelled'::text])),
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "nomor_jurnal" text NOT NULL UNIQUE;
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "tanggal" date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "keterangan" text NOT NULL;
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft'::text NOT NULL CHECK (status = ANY (ARRAY['draft'::text, 'posted'::text, 'cancelled'::text]));
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."journal_entries" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."journal_lines" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "journal_id" uuid NOT NULL,
 "account_id" uuid NOT NULL,
 "keterangan" text,
 "debit" numeric DEFAULT 0 NOT NULL CHECK (debit >= 0::numeric),
 "kredit" numeric DEFAULT 0 NOT NULL CHECK (kredit >= 0::numeric),
 CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."journal_lines" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."journal_lines" ADD COLUMN IF NOT EXISTS "journal_id" uuid NOT NULL;
ALTER TABLE public."journal_lines" ADD COLUMN IF NOT EXISTS "account_id" uuid NOT NULL;
ALTER TABLE public."journal_lines" ADD COLUMN IF NOT EXISTS "keterangan" text;
ALTER TABLE public."journal_lines" ADD COLUMN IF NOT EXISTS "debit" numeric DEFAULT 0 NOT NULL CHECK (debit >= 0::numeric);
ALTER TABLE public."journal_lines" ADD COLUMN IF NOT EXISTS "kredit" numeric DEFAULT 0 NOT NULL CHECK (kredit >= 0::numeric);

CREATE TABLE IF NOT EXISTS public."financial_transactions" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "nomor_transaksi" bigint NOT NULL UNIQUE,
 "tanggal" date DEFAULT CURRENT_DATE NOT NULL,
 "jenis" text NOT NULL CHECK (jenis = ANY (ARRAY['pemasukan'::text, 'pengeluaran'::text])),
 "akun_kas_id" uuid NOT NULL,
 "akun_lawan_id" uuid NOT NULL,
 "nominal" numeric NOT NULL CHECK (nominal > 0::numeric),
 "keterangan" text NOT NULL,
 "journal_id" uuid,
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."financial_transactions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."financial_transactions" ADD COLUMN IF NOT EXISTS "nomor_transaksi" bigint NOT NULL UNIQUE;
ALTER TABLE public."financial_transactions" ADD COLUMN IF NOT EXISTS "tanggal" date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public."financial_transactions" ADD COLUMN IF NOT EXISTS "jenis" text NOT NULL CHECK (jenis = ANY (ARRAY['pemasukan'::text, 'pengeluaran'::text]));
ALTER TABLE public."financial_transactions" ADD COLUMN IF NOT EXISTS "akun_kas_id" uuid NOT NULL;
ALTER TABLE public."financial_transactions" ADD COLUMN IF NOT EXISTS "akun_lawan_id" uuid NOT NULL;
ALTER TABLE public."financial_transactions" ADD COLUMN IF NOT EXISTS "nominal" numeric NOT NULL CHECK (nominal > 0::numeric);
ALTER TABLE public."financial_transactions" ADD COLUMN IF NOT EXISTS "keterangan" text NOT NULL;
ALTER TABLE public."financial_transactions" ADD COLUMN IF NOT EXISTS "journal_id" uuid;
ALTER TABLE public."financial_transactions" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."financial_transactions" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."business_partners" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "nama" text NOT NULL,
 "jenis" text NOT NULL CHECK (jenis = ANY (ARRAY['pelanggan'::text, 'supplier'::text, 'keduanya'::text])),
 "telepon" text,
 "alamat" text,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "business_partners_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."business_partners" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."business_partners" ADD COLUMN IF NOT EXISTS "nama" text NOT NULL;
ALTER TABLE public."business_partners" ADD COLUMN IF NOT EXISTS "jenis" text NOT NULL CHECK (jenis = ANY (ARRAY['pelanggan'::text, 'supplier'::text, 'keduanya'::text]));
ALTER TABLE public."business_partners" ADD COLUMN IF NOT EXISTS "telepon" text;
ALTER TABLE public."business_partners" ADD COLUMN IF NOT EXISTS "alamat" text;
ALTER TABLE public."business_partners" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."ar_ap_documents" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "jenis" text NOT NULL CHECK (jenis = ANY (ARRAY['piutang'::text, 'utang'::text])),
 "nomor" text NOT NULL UNIQUE,
 "partner_id" uuid NOT NULL,
 "tanggal" date DEFAULT CURRENT_DATE NOT NULL,
 "jatuh_tempo" date,
 "keterangan" text,
 "total" numeric NOT NULL CHECK (total > 0::numeric),
 "terbayar" numeric DEFAULT 0 NOT NULL,
 "status" text DEFAULT 'belum_lunas'::text NOT NULL CHECK (status = ANY (ARRAY['belum_lunas'::text, 'dibayar_sebagian'::text, 'lunas'::text])),
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "ar_ap_documents_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "jenis" text NOT NULL CHECK (jenis = ANY (ARRAY['piutang'::text, 'utang'::text]));
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "nomor" text NOT NULL UNIQUE;
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "partner_id" uuid NOT NULL;
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "tanggal" date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "jatuh_tempo" date;
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "keterangan" text;
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "total" numeric NOT NULL CHECK (total > 0::numeric);
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "terbayar" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'belum_lunas'::text NOT NULL CHECK (status = ANY (ARRAY['belum_lunas'::text, 'dibayar_sebagian'::text, 'lunas'::text]));
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."ar_ap_documents" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."ar_ap_payments" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "document_id" uuid NOT NULL,
 "tanggal" date DEFAULT CURRENT_DATE NOT NULL,
 "nominal" numeric NOT NULL CHECK (nominal > 0::numeric),
 "metode" text DEFAULT 'transfer'::text,
 "keterangan" text,
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "ar_ap_payments_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."ar_ap_payments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."ar_ap_payments" ADD COLUMN IF NOT EXISTS "document_id" uuid NOT NULL;
ALTER TABLE public."ar_ap_payments" ADD COLUMN IF NOT EXISTS "tanggal" date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public."ar_ap_payments" ADD COLUMN IF NOT EXISTS "nominal" numeric NOT NULL CHECK (nominal > 0::numeric);
ALTER TABLE public."ar_ap_payments" ADD COLUMN IF NOT EXISTS "metode" text DEFAULT 'transfer'::text;
ALTER TABLE public."ar_ap_payments" ADD COLUMN IF NOT EXISTS "keterangan" text;
ALTER TABLE public."ar_ap_payments" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."ar_ap_payments" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."bank_reconciliations" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "account_id" uuid NOT NULL,
 "period_start" date NOT NULL,
 "period_end" date NOT NULL,
 "statement_ending_balance" numeric DEFAULT 0 NOT NULL,
 "book_balance" numeric DEFAULT 0 NOT NULL,
 "difference" numeric DEFAULT 0 NOT NULL,
 "status" text DEFAULT 'draft'::text NOT NULL,
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "bank_reconciliations_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "account_id" uuid NOT NULL;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "period_start" date NOT NULL;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "period_end" date NOT NULL;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "statement_ending_balance" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "book_balance" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "difference" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft'::text NOT NULL;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."bank_reconciliations" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."bank_reconciliation_items" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "reconciliation_id" uuid NOT NULL,
 "item_type" text NOT NULL,
 "transaction_date" date NOT NULL,
 "description" text,
 "amount" numeric DEFAULT 0 NOT NULL,
 "journal_line_id" text,
 "matched" boolean DEFAULT false NOT NULL,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 "matched_journal_line_id" uuid,
 CONSTRAINT "bank_reconciliation_items_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."bank_reconciliation_items" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."bank_reconciliation_items" ADD COLUMN IF NOT EXISTS "reconciliation_id" uuid NOT NULL;
ALTER TABLE public."bank_reconciliation_items" ADD COLUMN IF NOT EXISTS "item_type" text NOT NULL;
ALTER TABLE public."bank_reconciliation_items" ADD COLUMN IF NOT EXISTS "transaction_date" date NOT NULL;
ALTER TABLE public."bank_reconciliation_items" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE public."bank_reconciliation_items" ADD COLUMN IF NOT EXISTS "amount" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."bank_reconciliation_items" ADD COLUMN IF NOT EXISTS "journal_line_id" text;
ALTER TABLE public."bank_reconciliation_items" ADD COLUMN IF NOT EXISTS "matched" boolean DEFAULT false NOT NULL;
ALTER TABLE public."bank_reconciliation_items" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."bank_reconciliation_items" ADD COLUMN IF NOT EXISTS "matched_journal_line_id" uuid;

CREATE TABLE IF NOT EXISTS public."invoices" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "invoice_number" text NOT NULL UNIQUE,
 "customer_name" text NOT NULL,
 "customer_phone" text,
 "customer_email" text,
 "customer_address" text,
 "issue_date" date DEFAULT CURRENT_DATE NOT NULL,
 "due_date" date,
 "subtotal" numeric DEFAULT 0 NOT NULL,
 "discount" numeric DEFAULT 0 NOT NULL,
 "tax" numeric DEFAULT 0 NOT NULL,
 "total" numeric DEFAULT 0 NOT NULL,
 "paid_amount" numeric DEFAULT 0 NOT NULL,
 "status" text DEFAULT 'draft'::text NOT NULL CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'partial'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])),
 "notes" text,
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 "invoice_type" text DEFAULT 'penjualan'::text NOT NULL,
 "supplier_name" text,
 "payment_status" text DEFAULT 'belum_dibayar'::text NOT NULL,
 CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "invoice_number" text NOT NULL UNIQUE;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "customer_name" text NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "customer_phone" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "customer_email" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "customer_address" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "issue_date" date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "due_date" date;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "subtotal" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "discount" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "tax" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "total" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "paid_amount" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'draft'::text NOT NULL CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'partial'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text]));
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "invoice_type" text DEFAULT 'penjualan'::text NOT NULL;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "supplier_name" text;
ALTER TABLE public."invoices" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'belum_dibayar'::text NOT NULL;

CREATE TABLE IF NOT EXISTS public."invoice_items" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "invoice_id" uuid NOT NULL,
 "description" text NOT NULL,
 "quantity" numeric DEFAULT 1 NOT NULL,
 "unit" text DEFAULT 'pcs'::text,
 "unit_price" numeric DEFAULT 0 NOT NULL,
 "line_total" numeric DEFAULT 0 NOT NULL,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 "product_id" uuid,
 CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."invoice_items" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."invoice_items" ADD COLUMN IF NOT EXISTS "invoice_id" uuid NOT NULL;
ALTER TABLE public."invoice_items" ADD COLUMN IF NOT EXISTS "description" text NOT NULL;
ALTER TABLE public."invoice_items" ADD COLUMN IF NOT EXISTS "quantity" numeric DEFAULT 1 NOT NULL;
ALTER TABLE public."invoice_items" ADD COLUMN IF NOT EXISTS "unit" text DEFAULT 'pcs'::text;
ALTER TABLE public."invoice_items" ADD COLUMN IF NOT EXISTS "unit_price" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."invoice_items" ADD COLUMN IF NOT EXISTS "line_total" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."invoice_items" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."invoice_items" ADD COLUMN IF NOT EXISTS "product_id" uuid;

CREATE TABLE IF NOT EXISTS public."operational_daily_logs" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "activity_date" date DEFAULT CURRENT_DATE NOT NULL,
 "activity_type" text NOT NULL CHECK (activity_type = ANY (ARRAY['pembukaan'::text, 'penutupan'::text, 'kegiatan'::text, 'kendala'::text])),
 "title" text NOT NULL,
 "description" text,
 "responsible_name" text NOT NULL,
 "status" text DEFAULT 'selesai'::text NOT NULL CHECK (status = ANY (ARRAY['proses'::text, 'selesai'::text, 'tertunda'::text])),
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "operational_daily_logs_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."operational_daily_logs" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."operational_daily_logs" ADD COLUMN IF NOT EXISTS "activity_date" date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public."operational_daily_logs" ADD COLUMN IF NOT EXISTS "activity_type" text NOT NULL CHECK (activity_type = ANY (ARRAY['pembukaan'::text, 'penutupan'::text, 'kegiatan'::text, 'kendala'::text]));
ALTER TABLE public."operational_daily_logs" ADD COLUMN IF NOT EXISTS "title" text NOT NULL;
ALTER TABLE public."operational_daily_logs" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE public."operational_daily_logs" ADD COLUMN IF NOT EXISTS "responsible_name" text NOT NULL;
ALTER TABLE public."operational_daily_logs" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'selesai'::text NOT NULL CHECK (status = ANY (ARRAY['proses'::text, 'selesai'::text, 'tertunda'::text]));
ALTER TABLE public."operational_daily_logs" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."operational_daily_logs" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."store_sales" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "sale_number" text NOT NULL UNIQUE,
 "sale_date" timestamptz DEFAULT now() NOT NULL,
 "customer_name" text,
 "payment_method" text DEFAULT 'tunai'::text NOT NULL CHECK (payment_method = ANY (ARRAY['tunai'::text, 'transfer'::text, 'qris'::text])),
 "subtotal" numeric DEFAULT 0 NOT NULL,
 "discount" numeric DEFAULT 0 NOT NULL,
 "total" numeric DEFAULT 0 NOT NULL,
 "paid_amount" numeric DEFAULT 0 NOT NULL,
 "change_amount" numeric DEFAULT 0 NOT NULL,
 "status" text DEFAULT 'selesai'::text NOT NULL CHECK (status = ANY (ARRAY['selesai'::text, 'dibatalkan'::text, 'diproses'::text, 'gagal'::text])),
 "notes" text,
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "store_sales_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "sale_number" text NOT NULL UNIQUE;
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "sale_date" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "customer_name" text;
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'tunai'::text NOT NULL CHECK (payment_method = ANY (ARRAY['tunai'::text, 'transfer'::text, 'qris'::text]));
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "subtotal" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "discount" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "total" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "paid_amount" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "change_amount" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'selesai'::text NOT NULL CHECK (status = ANY (ARRAY['selesai'::text, 'dibatalkan'::text, 'diproses'::text, 'gagal'::text]));
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."store_sales" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."store_sale_items" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "sale_id" uuid NOT NULL,
 "product_id" uuid,
 "product_code" text,
 "product_name" text NOT NULL,
 "quantity" numeric NOT NULL CHECK (quantity > 0::numeric),
 "unit" text DEFAULT 'pcs'::text,
 "unit_price" numeric NOT NULL CHECK (unit_price >= 0::numeric),
 "line_total" numeric NOT NULL CHECK (line_total >= 0::numeric),
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "store_sale_items_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."store_sale_items" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."store_sale_items" ADD COLUMN IF NOT EXISTS "sale_id" uuid NOT NULL;
ALTER TABLE public."store_sale_items" ADD COLUMN IF NOT EXISTS "product_id" uuid;
ALTER TABLE public."store_sale_items" ADD COLUMN IF NOT EXISTS "product_code" text;
ALTER TABLE public."store_sale_items" ADD COLUMN IF NOT EXISTS "product_name" text NOT NULL;
ALTER TABLE public."store_sale_items" ADD COLUMN IF NOT EXISTS "quantity" numeric NOT NULL CHECK (quantity > 0::numeric);
ALTER TABLE public."store_sale_items" ADD COLUMN IF NOT EXISTS "unit" text DEFAULT 'pcs'::text;
ALTER TABLE public."store_sale_items" ADD COLUMN IF NOT EXISTS "unit_price" numeric NOT NULL CHECK (unit_price >= 0::numeric);
ALTER TABLE public."store_sale_items" ADD COLUMN IF NOT EXISTS "line_total" numeric NOT NULL CHECK (line_total >= 0::numeric);
ALTER TABLE public."store_sale_items" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."inventory_products" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "product_code" text NOT NULL UNIQUE,
 "product_name" text NOT NULL,
 "category" text,
 "unit" text DEFAULT 'pcs'::text NOT NULL,
 "purchase_price" numeric DEFAULT 0 NOT NULL,
 "selling_price" numeric DEFAULT 0 NOT NULL,
 "stock" numeric DEFAULT 0 NOT NULL CHECK (stock >= 0::numeric),
 "minimum_stock" numeric DEFAULT 0 NOT NULL CHECK (minimum_stock >= 0::numeric),
 "description" text,
 "is_active" boolean DEFAULT true NOT NULL,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 "updated_at" timestamptz DEFAULT now() NOT NULL,
 "created_by" uuid,
 "current_stock" numeric DEFAULT 0 NOT NULL CHECK (current_stock >= 0::numeric),
 "notes" text,
 CONSTRAINT "inventory_products_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "product_code" text NOT NULL UNIQUE;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "product_name" text NOT NULL;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "category" text;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "unit" text DEFAULT 'pcs'::text NOT NULL;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "purchase_price" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "selling_price" numeric DEFAULT 0 NOT NULL;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "stock" numeric DEFAULT 0 NOT NULL CHECK (stock >= 0::numeric);
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "minimum_stock" numeric DEFAULT 0 NOT NULL CHECK (minimum_stock >= 0::numeric);
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "current_stock" numeric DEFAULT 0 NOT NULL CHECK (current_stock >= 0::numeric);
ALTER TABLE public."inventory_products" ADD COLUMN IF NOT EXISTS "notes" text;

CREATE TABLE IF NOT EXISTS public."inventory_movements" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "product_id" uuid NOT NULL,
 "movement_type" text NOT NULL CHECK (movement_type = ANY (ARRAY['stok_awal'::text, 'masuk'::text, 'keluar'::text, 'penyesuaian_masuk'::text, 'penyesuaian_keluar'::text])),
 "quantity" numeric NOT NULL CHECK (quantity > 0::numeric),
 "stock_before" numeric NOT NULL,
 "stock_after" numeric NOT NULL,
 "reference_number" text,
 "notes" text,
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 "movement_date" date DEFAULT CURRENT_DATE,
 "movement_number" text,
 "unit_cost" numeric DEFAULT 0,
 CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "product_id" uuid NOT NULL;
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "movement_type" text NOT NULL CHECK (movement_type = ANY (ARRAY['stok_awal'::text, 'masuk'::text, 'keluar'::text, 'penyesuaian_masuk'::text, 'penyesuaian_keluar'::text]));
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "quantity" numeric NOT NULL CHECK (quantity > 0::numeric);
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "stock_before" numeric NOT NULL;
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "stock_after" numeric NOT NULL;
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "reference_number" text;
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "movement_date" date DEFAULT CURRENT_DATE;
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "movement_number" text;
ALTER TABLE public."inventory_movements" ADD COLUMN IF NOT EXISTS "unit_cost" numeric DEFAULT 0;

CREATE TABLE IF NOT EXISTS public."cooperative_members" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "member_number" text NOT NULL UNIQUE,
 "full_name" text NOT NULL,
 "national_id" text,
 "phone" text,
 "address" text,
 "join_date" date DEFAULT CURRENT_DATE NOT NULL,
 "status" text DEFAULT 'aktif'::text NOT NULL CHECK (status = ANY (ARRAY['aktif'::text, 'nonaktif'::text])),
 "notes" text,
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 "updated_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "cooperative_members_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "member_number" text NOT NULL UNIQUE;
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "full_name" text NOT NULL;
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "national_id" text;
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "join_date" date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'aktif'::text NOT NULL CHECK (status = ANY (ARRAY['aktif'::text, 'nonaktif'::text]));
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."cooperative_members" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."member_savings_transactions" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "transaction_number" text NOT NULL UNIQUE,
 "member_id" uuid NOT NULL,
 "savings_type" text NOT NULL CHECK (savings_type = ANY (ARRAY['pokok'::text, 'wajib'::text, 'sukarela'::text])),
 "transaction_type" text NOT NULL CHECK (transaction_type = ANY (ARRAY['setoran'::text, 'penarikan'::text])),
 "amount" numeric NOT NULL CHECK (amount > 0::numeric),
 "transaction_date" timestamptz DEFAULT now() NOT NULL,
 "payment_method" text DEFAULT 'tunai'::text NOT NULL CHECK (payment_method = ANY (ARRAY['tunai'::text, 'transfer'::text, 'qris'::text])),
 "notes" text,
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "member_savings_transactions_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."member_savings_transactions" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."member_savings_transactions" ADD COLUMN IF NOT EXISTS "transaction_number" text NOT NULL UNIQUE;
ALTER TABLE public."member_savings_transactions" ADD COLUMN IF NOT EXISTS "member_id" uuid NOT NULL;
ALTER TABLE public."member_savings_transactions" ADD COLUMN IF NOT EXISTS "savings_type" text NOT NULL CHECK (savings_type = ANY (ARRAY['pokok'::text, 'wajib'::text, 'sukarela'::text]));
ALTER TABLE public."member_savings_transactions" ADD COLUMN IF NOT EXISTS "transaction_type" text NOT NULL CHECK (transaction_type = ANY (ARRAY['setoran'::text, 'penarikan'::text]));
ALTER TABLE public."member_savings_transactions" ADD COLUMN IF NOT EXISTS "amount" numeric NOT NULL CHECK (amount > 0::numeric);
ALTER TABLE public."member_savings_transactions" ADD COLUMN IF NOT EXISTS "transaction_date" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."member_savings_transactions" ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'tunai'::text NOT NULL CHECK (payment_method = ANY (ARRAY['tunai'::text, 'transfer'::text, 'qris'::text]));
ALTER TABLE public."member_savings_transactions" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public."member_savings_transactions" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."member_savings_transactions" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."member_loans" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "loan_number" text NOT NULL UNIQUE,
 "member_id" uuid NOT NULL,
 "application_date" date DEFAULT CURRENT_DATE NOT NULL,
 "principal_amount" numeric NOT NULL CHECK (principal_amount > 0::numeric),
 "term_months" integer NOT NULL CHECK (term_months > 0),
 "interest_method" text DEFAULT 'menurun'::text NOT NULL CHECK (interest_method = ANY (ARRAY['menurun'::text, 'tetap'::text])),
 "monthly_interest_rate" numeric DEFAULT 0 NOT NULL CHECK (monthly_interest_rate >= 0::numeric),
 "purpose" text,
 "status" text DEFAULT 'diajukan'::text NOT NULL CHECK (status = ANY (ARRAY['diajukan'::text, 'disetujui'::text, 'ditolak'::text, 'dicairkan'::text, 'lunas'::text, 'dibatalkan'::text])),
 "approved_by" uuid,
 "approved_at" timestamptz,
 "disbursed_by" uuid,
 "disbursed_at" timestamptz,
 "rejection_reason" text,
 "notes" text,
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 "updated_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "member_loans_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "loan_number" text NOT NULL UNIQUE;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "member_id" uuid NOT NULL;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "application_date" date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "principal_amount" numeric NOT NULL CHECK (principal_amount > 0::numeric);
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "term_months" integer NOT NULL CHECK (term_months > 0);
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "interest_method" text DEFAULT 'menurun'::text NOT NULL CHECK (interest_method = ANY (ARRAY['menurun'::text, 'tetap'::text]));
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "monthly_interest_rate" numeric DEFAULT 0 NOT NULL CHECK (monthly_interest_rate >= 0::numeric);
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "purpose" text;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'diajukan'::text NOT NULL CHECK (status = ANY (ARRAY['diajukan'::text, 'disetujui'::text, 'ditolak'::text, 'dicairkan'::text, 'lunas'::text, 'dibatalkan'::text]));
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "approved_by" uuid;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "approved_at" timestamptz;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "disbursed_by" uuid;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "disbursed_at" timestamptz;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "rejection_reason" text;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."member_loans" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."loan_installments" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "loan_id" uuid NOT NULL,
 "installment_number" integer NOT NULL CHECK (installment_number > 0),
 "due_date" date NOT NULL,
 "principal_due" numeric DEFAULT 0 NOT NULL CHECK (principal_due >= 0::numeric),
 "service_due" numeric DEFAULT 0 NOT NULL CHECK (service_due >= 0::numeric),
 "total_due" numeric DEFAULT 0 NOT NULL CHECK (total_due >= 0::numeric),
 "paid_amount" numeric DEFAULT 0 NOT NULL CHECK (paid_amount >= 0::numeric),
 "status" text DEFAULT 'belum_bayar'::text NOT NULL CHECK (status = ANY (ARRAY['belum_bayar'::text, 'sebagian'::text, 'lunas'::text, 'terlambat'::text])),
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "loan_installments_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."loan_installments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."loan_installments" ADD COLUMN IF NOT EXISTS "loan_id" uuid NOT NULL;
ALTER TABLE public."loan_installments" ADD COLUMN IF NOT EXISTS "installment_number" integer NOT NULL CHECK (installment_number > 0);
ALTER TABLE public."loan_installments" ADD COLUMN IF NOT EXISTS "due_date" date NOT NULL;
ALTER TABLE public."loan_installments" ADD COLUMN IF NOT EXISTS "principal_due" numeric DEFAULT 0 NOT NULL CHECK (principal_due >= 0::numeric);
ALTER TABLE public."loan_installments" ADD COLUMN IF NOT EXISTS "service_due" numeric DEFAULT 0 NOT NULL CHECK (service_due >= 0::numeric);
ALTER TABLE public."loan_installments" ADD COLUMN IF NOT EXISTS "total_due" numeric DEFAULT 0 NOT NULL CHECK (total_due >= 0::numeric);
ALTER TABLE public."loan_installments" ADD COLUMN IF NOT EXISTS "paid_amount" numeric DEFAULT 0 NOT NULL CHECK (paid_amount >= 0::numeric);
ALTER TABLE public."loan_installments" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'belum_bayar'::text NOT NULL CHECK (status = ANY (ARRAY['belum_bayar'::text, 'sebagian'::text, 'lunas'::text, 'terlambat'::text]));
ALTER TABLE public."loan_installments" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."loan_installment_payments" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "payment_number" text NOT NULL UNIQUE,
 "installment_id" uuid NOT NULL,
 "amount" numeric NOT NULL CHECK (amount > 0::numeric),
 "payment_date" timestamptz DEFAULT now() NOT NULL,
 "payment_method" text DEFAULT 'tunai'::text NOT NULL CHECK (payment_method = ANY (ARRAY['tunai'::text, 'transfer'::text, 'qris'::text])),
 "notes" text,
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "loan_installment_payments_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."loan_installment_payments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."loan_installment_payments" ADD COLUMN IF NOT EXISTS "payment_number" text NOT NULL UNIQUE;
ALTER TABLE public."loan_installment_payments" ADD COLUMN IF NOT EXISTS "installment_id" uuid NOT NULL;
ALTER TABLE public."loan_installment_payments" ADD COLUMN IF NOT EXISTS "amount" numeric NOT NULL CHECK (amount > 0::numeric);
ALTER TABLE public."loan_installment_payments" ADD COLUMN IF NOT EXISTS "payment_date" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."loan_installment_payments" ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'tunai'::text NOT NULL CHECK (payment_method = ANY (ARRAY['tunai'::text, 'transfer'::text, 'qris'::text]));
ALTER TABLE public."loan_installment_payments" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public."loan_installment_payments" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."loan_installment_payments" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."cooperative_finance_settings" (
 "id" integer DEFAULT 1 NOT NULL CHECK (id = 1),
 "default_interest_method" text DEFAULT 'menurun'::text NOT NULL CHECK (default_interest_method = ANY (ARRAY['menurun'::text, 'tetap'::text])),
 "default_monthly_interest_rate" numeric DEFAULT 0 NOT NULL CHECK (default_monthly_interest_rate >= 0::numeric),
 "updated_by" uuid,
 "updated_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "cooperative_finance_settings_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."cooperative_finance_settings" ADD COLUMN IF NOT EXISTS "id" integer DEFAULT 1 NOT NULL CHECK (id = 1);
ALTER TABLE public."cooperative_finance_settings" ADD COLUMN IF NOT EXISTS "default_interest_method" text DEFAULT 'menurun'::text NOT NULL CHECK (default_interest_method = ANY (ARRAY['menurun'::text, 'tetap'::text]));
ALTER TABLE public."cooperative_finance_settings" ADD COLUMN IF NOT EXISTS "default_monthly_interest_rate" numeric DEFAULT 0 NOT NULL CHECK (default_monthly_interest_rate >= 0::numeric);
ALTER TABLE public."cooperative_finance_settings" ADD COLUMN IF NOT EXISTS "updated_by" uuid;
ALTER TABLE public."cooperative_finance_settings" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."invoice_payments" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "invoice_id" uuid NOT NULL,
 "amount" numeric NOT NULL CHECK (amount > 0::numeric),
 "payment_date" date DEFAULT CURRENT_DATE NOT NULL,
 "payment_method" text DEFAULT 'tunai'::text,
 "notes" text,
 "created_by" uuid,
 "created_at" timestamptz DEFAULT now(),
 CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."invoice_payments" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."invoice_payments" ADD COLUMN IF NOT EXISTS "invoice_id" uuid NOT NULL;
ALTER TABLE public."invoice_payments" ADD COLUMN IF NOT EXISTS "amount" numeric NOT NULL CHECK (amount > 0::numeric);
ALTER TABLE public."invoice_payments" ADD COLUMN IF NOT EXISTS "payment_date" date DEFAULT CURRENT_DATE NOT NULL;
ALTER TABLE public."invoice_payments" ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'tunai'::text;
ALTER TABLE public."invoice_payments" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE public."invoice_payments" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE public."invoice_payments" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS public."cooperatives" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "name" text NOT NULL,
 "slug" text NOT NULL UNIQUE,
 "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "cooperatives_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."cooperatives" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."cooperatives" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
ALTER TABLE public."cooperatives" ADD COLUMN IF NOT EXISTS "slug" text NOT NULL UNIQUE;
ALTER TABLE public."cooperatives" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE public."cooperatives" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."cooperative_memberships" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "cooperative_id" uuid NOT NULL,
 "user_id" uuid NOT NULL,
 "role" text NOT NULL CHECK (role = ANY (ARRAY['manajer'::text, 'admin_keuangan'::text, 'kasir'::text, 'admin_gudang'::text, 'pengurus'::text])),
 "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "cooperative_memberships_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."cooperative_memberships" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."cooperative_memberships" ADD COLUMN IF NOT EXISTS "cooperative_id" uuid NOT NULL;
ALTER TABLE public."cooperative_memberships" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
ALTER TABLE public."cooperative_memberships" ADD COLUMN IF NOT EXISTS "role" text NOT NULL CHECK (role = ANY (ARRAY['manajer'::text, 'admin_keuangan'::text, 'kasir'::text, 'admin_gudang'::text, 'pengurus'::text]));
ALTER TABLE public."cooperative_memberships" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text]));
ALTER TABLE public."cooperative_memberships" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."cooperative_invitations" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "cooperative_id" uuid NOT NULL,
 "email" text NOT NULL,
 "role" text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'keuangan'::text, 'kasir'::text, 'gudang'::text])),
 "token_hash" text NOT NULL UNIQUE,
 "status" text DEFAULT 'pending'::text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'revoked'::text, 'expired'::text])),
 "invited_by" uuid NOT NULL,
 "expires_at" timestamptz NOT NULL,
 "accepted_by" uuid,
 "accepted_at" timestamptz,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "cooperative_invitations_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."cooperative_invitations" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."cooperative_invitations" ADD COLUMN IF NOT EXISTS "cooperative_id" uuid NOT NULL;
ALTER TABLE public."cooperative_invitations" ADD COLUMN IF NOT EXISTS "email" text NOT NULL;
ALTER TABLE public."cooperative_invitations" ADD COLUMN IF NOT EXISTS "role" text NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'keuangan'::text, 'kasir'::text, 'gudang'::text]));
ALTER TABLE public."cooperative_invitations" ADD COLUMN IF NOT EXISTS "token_hash" text NOT NULL UNIQUE;
ALTER TABLE public."cooperative_invitations" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending'::text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'revoked'::text, 'expired'::text]));
ALTER TABLE public."cooperative_invitations" ADD COLUMN IF NOT EXISTS "invited_by" uuid NOT NULL;
ALTER TABLE public."cooperative_invitations" ADD COLUMN IF NOT EXISTS "expires_at" timestamptz NOT NULL;
ALTER TABLE public."cooperative_invitations" ADD COLUMN IF NOT EXISTS "accepted_by" uuid;
ALTER TABLE public."cooperative_invitations" ADD COLUMN IF NOT EXISTS "accepted_at" timestamptz;
ALTER TABLE public."cooperative_invitations" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."dabu_conversations" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "user_id" uuid NOT NULL,
 "title" text DEFAULT 'Percakapan DABU'::text NOT NULL,
 "created_at" timestamptz DEFAULT now() NOT NULL,
 "updated_at" timestamptz DEFAULT now() NOT NULL,
 "last_message_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "dabu_conversations_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."dabu_conversations" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."dabu_conversations" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
ALTER TABLE public."dabu_conversations" ADD COLUMN IF NOT EXISTS "title" text DEFAULT 'Percakapan DABU'::text NOT NULL;
ALTER TABLE public."dabu_conversations" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."dabu_conversations" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;
ALTER TABLE public."dabu_conversations" ADD COLUMN IF NOT EXISTS "last_message_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."dabu_messages" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "conversation_id" uuid NOT NULL,
 "user_id" uuid NOT NULL,
 "role" text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
 "content" text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 10000),
 "created_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "dabu_messages_pkey" PRIMARY KEY ("id")
);
ALTER TABLE public."dabu_messages" ADD COLUMN IF NOT EXISTS "id" uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public."dabu_messages" ADD COLUMN IF NOT EXISTS "conversation_id" uuid NOT NULL;
ALTER TABLE public."dabu_messages" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
ALTER TABLE public."dabu_messages" ADD COLUMN IF NOT EXISTS "role" text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text]));
ALTER TABLE public."dabu_messages" ADD COLUMN IF NOT EXISTS "content" text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 10000);
ALTER TABLE public."dabu_messages" ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS public."dabu_user_memory" (
 "user_id" uuid NOT NULL,
 "memory_summary" text DEFAULT ''::text NOT NULL CHECK (char_length(memory_summary) <= 12000),
 "updated_at" timestamptz DEFAULT now() NOT NULL,
 CONSTRAINT "dabu_user_memory_pkey" PRIMARY KEY ("user_id")
);
ALTER TABLE public."dabu_user_memory" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
ALTER TABLE public."dabu_user_memory" ADD COLUMN IF NOT EXISTS "memory_summary" text DEFAULT ''::text NOT NULL CHECK (char_length(memory_summary) <= 12000);
ALTER TABLE public."dabu_user_memory" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now() NOT NULL;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_id_fkey' AND conrelid='public.profiles'::regclass) THEN ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='journal_entries_created_by_fkey' AND conrelid='public.journal_entries'::regclass) THEN ALTER TABLE public."journal_entries" ADD CONSTRAINT "journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."profiles" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='journal_lines_journal_id_fkey' AND conrelid='public.journal_lines'::regclass) THEN ALTER TABLE public."journal_lines" ADD CONSTRAINT "journal_lines_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES public."journal_entries" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='journal_lines_account_id_fkey' AND conrelid='public.journal_lines'::regclass) THEN ALTER TABLE public."journal_lines" ADD CONSTRAINT "journal_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES public."accounts" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='financial_transactions_created_by_fkey' AND conrelid='public.financial_transactions'::regclass) THEN ALTER TABLE public."financial_transactions" ADD CONSTRAINT "financial_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."profiles" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='financial_transactions_akun_kas_id_fkey' AND conrelid='public.financial_transactions'::regclass) THEN ALTER TABLE public."financial_transactions" ADD CONSTRAINT "financial_transactions_akun_kas_id_fkey" FOREIGN KEY ("akun_kas_id") REFERENCES public."accounts" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='financial_transactions_akun_lawan_id_fkey' AND conrelid='public.financial_transactions'::regclass) THEN ALTER TABLE public."financial_transactions" ADD CONSTRAINT "financial_transactions_akun_lawan_id_fkey" FOREIGN KEY ("akun_lawan_id") REFERENCES public."accounts" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='financial_transactions_journal_id_fkey' AND conrelid='public.financial_transactions'::regclass) THEN ALTER TABLE public."financial_transactions" ADD CONSTRAINT "financial_transactions_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES public."journal_entries" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ar_ap_documents_created_by_fkey' AND conrelid='public.ar_ap_documents'::regclass) THEN ALTER TABLE public."ar_ap_documents" ADD CONSTRAINT "ar_ap_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ar_ap_documents_partner_id_fkey' AND conrelid='public.ar_ap_documents'::regclass) THEN ALTER TABLE public."ar_ap_documents" ADD CONSTRAINT "ar_ap_documents_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES public."business_partners" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ar_ap_payments_created_by_fkey' AND conrelid='public.ar_ap_payments'::regclass) THEN ALTER TABLE public."ar_ap_payments" ADD CONSTRAINT "ar_ap_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ar_ap_payments_document_id_fkey' AND conrelid='public.ar_ap_payments'::regclass) THEN ALTER TABLE public."ar_ap_payments" ADD CONSTRAINT "ar_ap_payments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES public."ar_ap_documents" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bank_reconciliations_created_by_fkey' AND conrelid='public.bank_reconciliations'::regclass) THEN ALTER TABLE public."bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bank_reconciliations_account_id_fkey' AND conrelid='public.bank_reconciliations'::regclass) THEN ALTER TABLE public."bank_reconciliations" ADD CONSTRAINT "bank_reconciliations_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES public."accounts" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bank_reconciliation_items_reconciliation_id_fkey' AND conrelid='public.bank_reconciliation_items'::regclass) THEN ALTER TABLE public."bank_reconciliation_items" ADD CONSTRAINT "bank_reconciliation_items_reconciliation_id_fkey" FOREIGN KEY ("reconciliation_id") REFERENCES public."bank_reconciliations" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='bank_reconciliation_items_matched_journal_line_id_fkey' AND conrelid='public.bank_reconciliation_items'::regclass) THEN ALTER TABLE public."bank_reconciliation_items" ADD CONSTRAINT "bank_reconciliation_items_matched_journal_line_id_fkey" FOREIGN KEY ("matched_journal_line_id") REFERENCES public."journal_lines" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='invoices_created_by_fkey' AND conrelid='public.invoices'::regclass) THEN ALTER TABLE public."invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='invoice_items_invoice_id_fkey' AND conrelid='public.invoice_items'::regclass) THEN ALTER TABLE public."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES public."invoices" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='invoice_items_product_id_fkey' AND conrelid='public.invoice_items'::regclass) THEN ALTER TABLE public."invoice_items" ADD CONSTRAINT "invoice_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES public."inventory_products" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='operational_daily_logs_created_by_fkey' AND conrelid='public.operational_daily_logs'::regclass) THEN ALTER TABLE public."operational_daily_logs" ADD CONSTRAINT "operational_daily_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='store_sales_created_by_fkey' AND conrelid='public.store_sales'::regclass) THEN ALTER TABLE public."store_sales" ADD CONSTRAINT "store_sales_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='store_sale_items_sale_id_fkey' AND conrelid='public.store_sale_items'::regclass) THEN ALTER TABLE public."store_sale_items" ADD CONSTRAINT "store_sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES public."store_sales" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='inventory_products_created_by_fkey' AND conrelid='public.inventory_products'::regclass) THEN ALTER TABLE public."inventory_products" ADD CONSTRAINT "inventory_products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='inventory_movements_product_id_fkey' AND conrelid='public.inventory_movements'::regclass) THEN ALTER TABLE public."inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES public."inventory_products" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='inventory_movements_created_by_fkey' AND conrelid='public.inventory_movements'::regclass) THEN ALTER TABLE public."inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cooperative_members_created_by_fkey' AND conrelid='public.cooperative_members'::regclass) THEN ALTER TABLE public."cooperative_members" ADD CONSTRAINT "cooperative_members_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='member_savings_transactions_member_id_fkey' AND conrelid='public.member_savings_transactions'::regclass) THEN ALTER TABLE public."member_savings_transactions" ADD CONSTRAINT "member_savings_transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES public."cooperative_members" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='member_savings_transactions_created_by_fkey' AND conrelid='public.member_savings_transactions'::regclass) THEN ALTER TABLE public."member_savings_transactions" ADD CONSTRAINT "member_savings_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='member_loans_member_id_fkey' AND conrelid='public.member_loans'::regclass) THEN ALTER TABLE public."member_loans" ADD CONSTRAINT "member_loans_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES public."cooperative_members" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='member_loans_approved_by_fkey' AND conrelid='public.member_loans'::regclass) THEN ALTER TABLE public."member_loans" ADD CONSTRAINT "member_loans_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='member_loans_disbursed_by_fkey' AND conrelid='public.member_loans'::regclass) THEN ALTER TABLE public."member_loans" ADD CONSTRAINT "member_loans_disbursed_by_fkey" FOREIGN KEY ("disbursed_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='member_loans_created_by_fkey' AND conrelid='public.member_loans'::regclass) THEN ALTER TABLE public."member_loans" ADD CONSTRAINT "member_loans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='loan_installments_loan_id_fkey' AND conrelid='public.loan_installments'::regclass) THEN ALTER TABLE public."loan_installments" ADD CONSTRAINT "loan_installments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES public."member_loans" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='loan_installment_payments_installment_id_fkey' AND conrelid='public.loan_installment_payments'::regclass) THEN ALTER TABLE public."loan_installment_payments" ADD CONSTRAINT "loan_installment_payments_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES public."loan_installments" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='loan_installment_payments_created_by_fkey' AND conrelid='public.loan_installment_payments'::regclass) THEN ALTER TABLE public."loan_installment_payments" ADD CONSTRAINT "loan_installment_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cooperative_finance_settings_updated_by_fkey' AND conrelid='public.cooperative_finance_settings'::regclass) THEN ALTER TABLE public."cooperative_finance_settings" ADD CONSTRAINT "cooperative_finance_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='invoice_payments_invoice_id_fkey' AND conrelid='public.invoice_payments'::regclass) THEN ALTER TABLE public."invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES public."invoices" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cooperative_memberships_user_id_fkey' AND conrelid='public.cooperative_memberships'::regclass) THEN ALTER TABLE public."cooperative_memberships" ADD CONSTRAINT "cooperative_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cooperative_memberships_cooperative_id_fkey' AND conrelid='public.cooperative_memberships'::regclass) THEN ALTER TABLE public."cooperative_memberships" ADD CONSTRAINT "cooperative_memberships_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES public."cooperatives" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cooperative_invitations_cooperative_id_fkey' AND conrelid='public.cooperative_invitations'::regclass) THEN ALTER TABLE public."cooperative_invitations" ADD CONSTRAINT "cooperative_invitations_cooperative_id_fkey" FOREIGN KEY ("cooperative_id") REFERENCES public."cooperatives" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cooperative_invitations_accepted_by_fkey' AND conrelid='public.cooperative_invitations'::regclass) THEN ALTER TABLE public."cooperative_invitations" ADD CONSTRAINT "cooperative_invitations_accepted_by_fkey" FOREIGN KEY ("accepted_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='cooperative_invitations_invited_by_fkey' AND conrelid='public.cooperative_invitations'::regclass) THEN ALTER TABLE public."cooperative_invitations" ADD CONSTRAINT "cooperative_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='dabu_conversations_user_id_fkey' AND conrelid='public.dabu_conversations'::regclass) THEN ALTER TABLE public."dabu_conversations" ADD CONSTRAINT "dabu_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='dabu_messages_user_id_fkey' AND conrelid='public.dabu_messages'::regclass) THEN ALTER TABLE public."dabu_messages" ADD CONSTRAINT "dabu_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='dabu_messages_conversation_owner_fk' AND conrelid='public.dabu_messages'::regclass) THEN ALTER TABLE public."dabu_messages" ADD CONSTRAINT "dabu_messages_conversation_owner_fk" FOREIGN KEY ("conversation_id", "user_id") REFERENCES public."dabu_conversations" ("id", "user_id"); END IF; END $dagboek$;
DO $dagboek$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='dabu_user_memory_user_id_fkey' AND conrelid='public.dabu_user_memory'::regclass) THEN ALTER TABLE public."dabu_user_memory" ADD CONSTRAINT "dabu_user_memory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES public."app_users" ("id"); END IF; END $dagboek$;

-- Keep application tables isolated; API accesses them through the Worker runtime role.
GRANT USAGE ON SCHEMA public TO dagboek_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dagboek_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dagboek_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dagboek_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO dagboek_app;
