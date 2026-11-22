-- DAGBOEK initial PostgreSQL schema
-- Safe additive migration: creates missing foundational tables only.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text,
  password_salt text,
  nama_lengkap text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_akun text NOT NULL UNIQUE,
  nama_akun text NOT NULL,
  kategori text NOT NULL,
  saldo_normal text NOT NULL CHECK (saldo_normal IN ('debit','kredit')),
  aktif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor_jurnal text NOT NULL UNIQUE,
  tanggal date NOT NULL,
  keterangan text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','posted','cancelled')),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id),
  keterangan text,
  debit numeric(18,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  kredit numeric(18,2) NOT NULL DEFAULT 0 CHECK (kredit >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (NOT (debit > 0 AND kredit > 0))
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal date NOT NULL,
  jenis text NOT NULL CHECK (jenis IN ('pemasukan','pengeluaran')),
  akun_kas_id uuid NOT NULL REFERENCES public.accounts(id),
  akun_lawan_id uuid NOT NULL REFERENCES public.accounts(id),
  nominal numeric(18,2) NOT NULL CHECK (nominal > 0),
  keterangan text,
  journal_id uuid REFERENCES public.journal_entries(id),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON public.journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_lines_journal ON public.journal_lines(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON public.journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON public.financial_transactions(tanggal DESC);
