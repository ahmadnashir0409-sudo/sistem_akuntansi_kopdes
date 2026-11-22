-- DAGBOEK integrity and RPC access hardening
-- Prepared for review; not yet applied to production.
CREATE OR REPLACE FUNCTION public.process_inventory_movement()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_stock NUMERIC(15,3);
  v_old_price NUMERIC(15,2);
  v_new_stock NUMERIC(15,3);
  v_new_price NUMERIC(15,2);
BEGIN
  SELECT current_stock, purchase_price
  INTO v_stock, v_old_price
  FROM public.inventory_products
  WHERE id = NEW.product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Barang tidak ditemukan.';
  END IF;

  IF NEW.movement_type IN (
    'stok_awal',
    'masuk',
    'penyesuaian_masuk'
  ) THEN

    v_new_stock := v_stock + NEW.quantity;

    IF NEW.movement_type IN ('stok_awal','masuk')
       AND NEW.unit_cost > 0 THEN

      IF v_new_stock > 0 THEN
        v_new_price :=
          (
            (v_stock * v_old_price) +
            (NEW.quantity * NEW.unit_cost)
          ) / v_new_stock;
      ELSE
        v_new_price := NEW.unit_cost;
      END IF;

    ELSE
      v_new_price := v_old_price;
    END IF;

  ELSE

    IF NEW.quantity > v_stock THEN
      RAISE EXCEPTION
        'Stok tidak mencukupi. Stok tersedia: %', v_stock;
    END IF;

    v_new_stock := v_stock - NEW.quantity;
    v_new_price := v_old_price;

  END IF;

  -- Persist the exact locked stock snapshot, not potentially stale client values.
  NEW.stock_before := v_stock;
  NEW.stock_after := v_new_stock;

  UPDATE public.inventory_products
  SET
    current_stock = v_new_stock,
    purchase_price = v_new_price,
    updated_at = NOW()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_invoice_journal(p_invoice_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invoice RECORD;
  v_debit_account uuid;
  v_credit_account uuid;
  v_journal_id uuid;
  v_journal_number text;
  v_description text;
BEGIN
  IF COALESCE(public.current_user_role(), '') NOT IN ('manajer', 'admin_keuangan') THEN
    RAISE EXCEPTION 'Akses tidak diizinkan untuk operasi pencatatan jurnal invoice.';
  END IF;


  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Silakan login terlebih dahulu';
  END IF;

  SELECT id, invoice_number, invoice_type, issue_date, total, created_by
    INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice tidak ditemukan';
  END IF;

  IF COALESCE(v_invoice.total, 0) <= 0 THEN
    RAISE EXCEPTION 'Total invoice harus lebih dari nol untuk dijurnal';
  END IF;

  v_description := 'Jurnal otomatis invoice ' || v_invoice.invoice_number;

  SELECT id INTO v_journal_id
  FROM public.journal_entries
  WHERE keterangan = v_description
  LIMIT 1;

  IF v_journal_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id, 'duplicate', true);
  END IF;

  IF v_invoice.invoice_type = 'penjualan' THEN
    SELECT id INTO v_debit_account FROM public.accounts WHERE kode_akun = '1105' AND aktif = true LIMIT 1;
    SELECT id INTO v_credit_account FROM public.accounts WHERE kode_akun = '4101' AND aktif = true LIMIT 1;
  ELSIF v_invoice.invoice_type = 'pembelian' THEN
    SELECT id INTO v_debit_account FROM public.accounts WHERE kode_akun = '1104' AND aktif = true LIMIT 1;
    SELECT id INTO v_credit_account FROM public.accounts WHERE kode_akun = '2101' AND aktif = true LIMIT 1;
  ELSE
    RAISE EXCEPTION 'Jenis invoice tidak dikenali: %', v_invoice.invoice_type;
  END IF;

  IF v_debit_account IS NULL OR v_credit_account IS NULL THEN
    RAISE EXCEPTION 'Akun jurnal invoice tidak ditemukan atau tidak aktif. Periksa akun 1105/4101 atau 1104/2101.';
  END IF;

  v_journal_number := 'JU-INV-' || to_char(COALESCE(v_invoice.issue_date, CURRENT_DATE), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.journal_entries (nomor_jurnal, tanggal, keterangan, status, created_by)
  VALUES (v_journal_number, COALESCE(v_invoice.issue_date, CURRENT_DATE), v_description, 'draft', COALESCE(v_invoice.created_by, auth.uid()))
  RETURNING id INTO v_journal_id;

  INSERT INTO public.journal_lines (journal_id, account_id, keterangan, debit, kredit)
  VALUES
    (v_journal_id, v_debit_account, v_description, v_invoice.total, 0),
    (v_journal_id, v_credit_account, v_description, 0, v_invoice.total);

  UPDATE public.journal_entries SET status = 'posted' WHERE id = v_journal_id;

  RETURN jsonb_build_object('success', true, 'journal_id', v_journal_id, 'journal_number', v_journal_number, 'duplicate', false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_invoice_payment(p_invoice_id uuid, p_amount numeric, p_payment_date date, p_payment_method text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invoice RECORD;
  v_new_paid numeric;
  v_remaining numeric;
  v_payment_id uuid;
  v_payment_status text;
  v_status text;
  v_cash_account uuid;
  v_receivable_account uuid;
  v_payable_account uuid;
  v_journal_id uuid;
  v_journal_number text;
  v_description text;
  v_method text;
BEGIN
  IF COALESCE(public.current_user_role(), '') NOT IN ('manajer', 'admin_keuangan') THEN
    RAISE EXCEPTION 'Akses tidak diizinkan untuk operasi pembayaran invoice.';
  END IF;


  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Silakan login terlebih dahulu';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Nominal pembayaran harus lebih dari nol';
  END IF;

  SELECT id, invoice_number, invoice_type, total, paid_amount, created_by
    INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice tidak ditemukan';
  END IF;

  v_remaining := COALESCE(v_invoice.total, 0) - COALESCE(v_invoice.paid_amount, 0);
  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'Pembayaran melebihi sisa tagihan: %', v_remaining;
  END IF;

  v_new_paid := COALESCE(v_invoice.paid_amount, 0) + p_amount;
  IF v_new_paid >= COALESCE(v_invoice.total, 0) THEN
    v_payment_status := 'lunas';
    v_status := 'paid';
  ELSE
    v_payment_status := 'dibayar_sebagian';
    v_status := 'partial';
  END IF;

  v_method := lower(trim(COALESCE(p_payment_method, 'tunai')));
  IF v_method IN ('transfer', 'transfer bank', 'qris') THEN
    SELECT id INTO v_cash_account FROM public.accounts WHERE kode_akun = '1102' AND aktif = true LIMIT 1;
  ELSE
    SELECT id INTO v_cash_account FROM public.accounts WHERE kode_akun = '1101' AND aktif = true LIMIT 1;
  END IF;

  IF v_cash_account IS NULL THEN
    RAISE EXCEPTION 'Akun Kas/Bank untuk metode pembayaran tidak ditemukan atau tidak aktif';
  END IF;

  IF v_invoice.invoice_type = 'penjualan' THEN
    SELECT id INTO v_receivable_account FROM public.accounts WHERE kode_akun = '1105' AND aktif = true LIMIT 1;
    IF v_receivable_account IS NULL THEN
      RAISE EXCEPTION 'Akun Piutang Usaha 1105 tidak ditemukan atau tidak aktif';
    END IF;
  ELSIF v_invoice.invoice_type = 'pembelian' THEN
    SELECT id INTO v_payable_account FROM public.accounts WHERE kode_akun = '2101' AND aktif = true LIMIT 1;
    IF v_payable_account IS NULL THEN
      RAISE EXCEPTION 'Akun Utang Usaha 2101 tidak ditemukan atau tidak aktif';
    END IF;
  ELSE
    RAISE EXCEPTION 'Jenis invoice tidak dikenali: %', v_invoice.invoice_type;
  END IF;

  INSERT INTO public.invoice_payments (
    invoice_id, amount, payment_date, payment_method, notes, created_by
  ) VALUES (
    p_invoice_id, p_amount, COALESCE(p_payment_date, CURRENT_DATE), v_method, p_notes, auth.uid()
  ) RETURNING id INTO v_payment_id;

  UPDATE public.invoices
  SET paid_amount = v_new_paid,
      payment_status = v_payment_status,
      status = v_status
  WHERE id = p_invoice_id;

  v_description := 'Pembayaran invoice ' || v_invoice.invoice_number || ' / ' || v_payment_id::text;
  v_journal_number := 'JU-BYR-' || to_char(COALESCE(p_payment_date, CURRENT_DATE), 'YYYYMMDD') || '-' || upper(substr(replace(v_payment_id::text, '-', ''), 1, 8));

  INSERT INTO public.journal_entries (nomor_jurnal, tanggal, keterangan, status, created_by)
  VALUES (v_journal_number, COALESCE(p_payment_date, CURRENT_DATE), v_description, 'draft', auth.uid())
  RETURNING id INTO v_journal_id;

  IF v_invoice.invoice_type = 'penjualan' THEN
    INSERT INTO public.journal_lines (journal_id, account_id, keterangan, debit, kredit)
    VALUES
      (v_journal_id, v_cash_account, v_description, p_amount, 0),
      (v_journal_id, v_receivable_account, v_description, 0, p_amount);
  ELSE
    INSERT INTO public.journal_lines (journal_id, account_id, keterangan, debit, kredit)
    VALUES
      (v_journal_id, v_payable_account, v_description, p_amount, 0),
      (v_journal_id, v_cash_account, v_description, 0, p_amount);
  END IF;

  UPDATE public.journal_entries SET status = 'posted' WHERE id = v_journal_id;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'paid_amount', v_new_paid,
    'remaining', COALESCE(v_invoice.total, 0) - v_new_paid,
    'payment_status', v_payment_status,
    'journal_id', v_journal_id,
    'journal_number', v_journal_number
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.pay_loan_installment(p_payment_number text, p_installment_id uuid, p_amount numeric, p_payment_method text DEFAULT 'tunai'::text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_installment public.loan_installments%ROWTYPE;
  v_remaining NUMERIC(15,2);
  v_new_paid NUMERIC(15,2);
  v_new_status TEXT;
  v_remaining_installments INTEGER;
BEGIN
  IF COALESCE(public.current_user_role(), '') NOT IN ('manajer', 'admin_keuangan') THEN
    RAISE EXCEPTION 'Akses tidak diizinkan untuk operasi pembayaran angsuran.';
  END IF;


  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Silakan login terlebih dahulu.';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Nominal pembayaran harus lebih besar dari nol.';
  END IF;

  IF p_payment_method NOT IN ('tunai','transfer','qris') THEN
    RAISE EXCEPTION 'Metode pembayaran tidak valid.';
  END IF;

  SELECT *
  INTO v_installment
  FROM public.loan_installments
  WHERE id = p_installment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jadwal angsuran tidak ditemukan.';
  END IF;

  v_remaining := v_installment.total_due - v_installment.paid_amount;

  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'Angsuran ini sudah lunas.';
  END IF;

  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'Pembayaran melebihi sisa tagihan sebesar %.', v_remaining;
  END IF;

  v_new_paid := v_installment.paid_amount + p_amount;

  IF v_new_paid >= v_installment.total_due THEN
    v_new_status := 'lunas';
  ELSIF v_installment.due_date < CURRENT_DATE THEN
    v_new_status := 'terlambat';
  ELSE
    v_new_status := 'sebagian';
  END IF;

  INSERT INTO public.loan_installment_payments (
    payment_number,
    installment_id,
    amount,
    payment_date,
    payment_method,
    notes,
    created_by
  )
  VALUES (
    p_payment_number,
    p_installment_id,
    p_amount,
    NOW(),
    p_payment_method,
    p_notes,
    auth.uid()
  );

  UPDATE public.loan_installments
  SET
    paid_amount = v_new_paid,
    status = v_new_status
  WHERE id = p_installment_id;

  SELECT COUNT(*)
  INTO v_remaining_installments
  FROM public.loan_installments
  WHERE loan_id = v_installment.loan_id
    AND paid_amount < total_due;

  IF v_remaining_installments = 0 THEN
    UPDATE public.member_loans
    SET
      status = 'lunas',
      updated_at = NOW()
    WHERE id = v_installment.loan_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'payment_number', p_payment_number,
    'paid_amount', v_new_paid,
    'remaining_amount', v_installment.total_due - v_new_paid,
    'status', v_new_status
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.catat_jurnal_penjualan_toko(p_nomor_transaksi text, p_tanggal date, p_metode_pembayaran text, p_total_penjualan numeric, p_total_hpp numeric, p_keterangan text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_journal_id uuid;
  v_nomor_jurnal text;
  v_akun_kas uuid;
  v_akun_pendapatan uuid;
  v_akun_persediaan uuid;
  v_akun_hpp uuid;
  v_total numeric := round(coalesce(p_total_penjualan,0),2);
  v_hpp numeric := round(coalesce(p_total_hpp,0),2);
BEGIN
  IF COALESCE(public.current_user_role(), '') NOT IN ('manajer', 'admin_keuangan') THEN
    RAISE EXCEPTION 'Akses tidak diizinkan untuk operasi jurnal penjualan toko.';
  END IF;


  if auth.uid() is null then
    raise exception 'Sesi login tidak valid.';
  end if;

  if p_nomor_transaksi is null
     or length(trim(p_nomor_transaksi)) = 0 then
    raise exception 'Nomor transaksi wajib diisi.';
  end if;

  if v_total <= 0 or v_hpp < 0 then
    raise exception 'Nilai penjualan atau HPP tidak valid.';
  end if;

  if p_metode_pembayaran not in ('tunai','transfer','qris') then
    raise exception 'Metode pembayaran tidak dikenali.';
  end if;

  -- Mencegah jurnal ganda untuk satu transaksi.
  perform pg_advisory_xact_lock(hashtext(p_nomor_transaksi));

  select id into v_journal_id
  from public.journal_entries
  where keterangan = coalesce(
    p_keterangan,
    'Penjualan Transaksi Toko ' || p_nomor_transaksi
  )
  and status = 'posted'
  limit 1;

  if v_journal_id is not null then
    return v_journal_id;
  end if;

  -- Tunai masuk Kas, transfer dan QRIS masuk Bank.
  select id into v_akun_kas
  from public.accounts
  where kode_akun = case
    when p_metode_pembayaran = 'tunai' then '1101'
    else '1102'
  end
  and aktif = true
  limit 1;

  select id into v_akun_pendapatan
  from public.accounts
  where kode_akun = '4101' and aktif = true
  limit 1;

  select id into v_akun_persediaan
  from public.accounts
  where kode_akun = '1104' and aktif = true
  limit 1;

  select id into v_akun_hpp
  from public.accounts
  where kode_akun = '5104' and aktif = true
  limit 1;

  if v_akun_kas is null
     or v_akun_pendapatan is null
     or v_akun_persediaan is null
     or v_akun_hpp is null then
    raise exception
      'Akun 1101/1102, 1104, 4101, atau 5104 belum tersedia atau belum aktif.';
  end if;

  v_nomor_jurnal :=
    'JU-' || to_char(p_tanggal,'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));

  insert into public.journal_entries
    (nomor_jurnal,tanggal,keterangan,status,created_by)
  values
    (
      v_nomor_jurnal,
      p_tanggal,
      coalesce(
        p_keterangan,
        'Penjualan Transaksi Toko ' || p_nomor_transaksi
      ),
      'draft',
      auth.uid()
    )
  returning id into v_journal_id;

  -- Jurnal penerimaan penjualan.
  insert into public.journal_lines
    (journal_id,account_id,keterangan,debit,kredit)
  values
    (
      v_journal_id,
      v_akun_kas,
      'Penerimaan penjualan ' || p_nomor_transaksi,
      v_total,
      0
    ),
    (
      v_journal_id,
      v_akun_pendapatan,
      'Pendapatan penjualan ' || p_nomor_transaksi,
      0,
      v_total
    );

  -- Jurnal HPP dan pengurangan persediaan.
  if v_hpp > 0 then
    insert into public.journal_lines
      (journal_id,account_id,keterangan,debit,kredit)
    values
      (
        v_journal_id,
        v_akun_hpp,
        'HPP penjualan ' || p_nomor_transaksi,
        v_hpp,
        0
      ),
      (
        v_journal_id,
        v_akun_persediaan,
        'Pengurangan persediaan ' || p_nomor_transaksi,
        0,
        v_hpp
      );
  end if;

  update public.journal_entries
  set status = 'posted'
  where id = v_journal_id;

  return v_journal_id;
end;
$function$;

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_journal_invoice() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_journal_invoice_payment() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_inventory_movement() FROM PUBLIC, anon, authenticated;
-- Clients may edit product metadata but never write stock columns directly.
REVOKE INSERT, UPDATE ON TABLE public.inventory_products FROM PUBLIC, anon, authenticated;
GRANT INSERT (product_code, product_name, category, unit, purchase_price, selling_price, minimum_stock, description, is_active, created_by, notes) ON TABLE public.inventory_products TO authenticated;
GRANT UPDATE (product_code, product_name, category, unit, purchase_price, selling_price, minimum_stock, description, is_active, created_by, notes) ON TABLE public.inventory_products TO authenticated;
REVOKE ALL ON FUNCTION public.prevent_posted_journal_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_posted_journal_line_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_journal_balance() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
REVOKE ALL ON FUNCTION public.batalkan_transaksi_toko(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.batalkan_transaksi_toko(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.proses_penjualan_toko_atomik(p_sale jsonb, p_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid;
    v_role text;
    v_sale_id uuid;
    v_sale_number text;
    v_payment_method text;
    v_sale_date timestamptz := now();

    v_subtotal numeric := 0;
    v_input_subtotal numeric;
    v_discount numeric := 0;
    v_total numeric := 0;
    v_paid numeric := 0;
    v_change numeric := 0;
    v_hpp numeric := 0;

    v_item record;
    v_product record;
    v_product_count integer := 0;
    v_expected_products integer := 0;
    v_line_total numeric;

    v_account_cash uuid;
    v_account_revenue uuid;
    v_account_inventory uuid;
    v_account_hpp uuid;

    v_journal_id uuid;
    v_journal_number text;
BEGIN
    -- 1. Validasi sesi dan hak akses
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Sesi login tidak valid.';
    END IF;

    v_role := public.current_user_role();

    IF COALESCE(v_role, '') NOT IN ('manajer', 'kasir') THEN
        RAISE EXCEPTION 'Hanya Manajer atau Kasir yang boleh melakukan transaksi.';
    END IF;

    -- 2. Validasi data input
    IF jsonb_typeof(p_sale) <> 'object' THEN
        RAISE EXCEPTION 'Data transaksi tidak valid.';
    END IF;

    IF jsonb_typeof(p_items) <> 'array'
       OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Minimal harus ada satu barang.';
    END IF;

    v_sale_number := trim(p_sale->>'sale_number');
    v_payment_method := p_sale->>'payment_method';

    IF COALESCE(v_sale_number, '') = '' THEN
        RAISE EXCEPTION 'Nomor transaksi wajib diisi.';
    END IF;

    IF v_payment_method NOT IN ('tunai', 'transfer', 'qris') THEN
        RAISE EXCEPTION 'Metode pembayaran tidak valid.';
    END IF;

    v_discount := round(
        COALESCE((p_sale->>'discount')::numeric, 0), 2
    );

    v_paid := round(
        COALESCE((p_sale->>'paid_amount')::numeric, 0), 2
    );

    IF v_discount < 0 OR v_paid < 0 THEN
        RAISE EXCEPTION 'Diskon atau pembayaran tidak valid.';
    END IF;

    -- 3. Hitung subtotal dari detail barang
    FOR v_item IN
        SELECT *
        FROM jsonb_to_recordset(p_items)
        AS x(
            product_id uuid,
            quantity numeric,
            unit_price numeric
        )
    LOOP
        IF v_item.product_id IS NULL
           OR v_item.quantity IS NULL
           OR v_item.unit_price IS NULL
           OR v_item.quantity <= 0
           OR v_item.unit_price < 0 THEN
            RAISE EXCEPTION 'Detail barang memiliki data tidak valid.';
        END IF;

        v_line_total := round(
            v_item.quantity * v_item.unit_price, 2
        );

        v_subtotal := v_subtotal + v_line_total;
    END LOOP;

    v_subtotal := round(v_subtotal, 2);

    v_input_subtotal := round(
        COALESCE((p_sale->>'subtotal')::numeric, v_subtotal), 2
    );

    IF abs(v_input_subtotal - v_subtotal) > 0.01 THEN
        RAISE EXCEPTION 'Subtotal tidak sesuai dengan detail barang.';
    END IF;

    IF v_discount > v_subtotal THEN
        RAISE EXCEPTION 'Diskon melebihi subtotal.';
    END IF;

    v_total := round(v_subtotal - v_discount, 2);

    IF v_total <= 0 THEN
        RAISE EXCEPTION 'Total transaksi harus lebih dari nol.';
    END IF;

    IF v_paid < v_total THEN
        RAISE EXCEPTION 'Pembayaran belum mencukupi total transaksi.';
    END IF;

    v_change := round(v_paid - v_total, 2);

    IF p_sale ? 'total'
       AND abs((p_sale->>'total')::numeric - v_total) > 0.01 THEN
        RAISE EXCEPTION 'Total transaksi tidak sesuai.';
    END IF;

    IF p_sale ? 'change_amount'
       AND abs((p_sale->>'change_amount')::numeric - v_change) > 0.01 THEN
        RAISE EXCEPTION 'Uang kembalian tidak sesuai.';
    END IF;

    -- 4. Kunci seluruh produk dalam urutan konsisten.
    -- Menghindari dua transaksi memakai stok yang sama.
    SELECT count(DISTINCT product_id)
    INTO v_expected_products
    FROM jsonb_to_recordset(p_items)
    AS x(product_id uuid, quantity numeric);

    FOR v_product IN
        SELECT
            ip.id,
            ip.product_code,
            ip.product_name,
            ip.unit,
            ip.current_stock,
            ip.purchase_price,
            grouped.total_qty
        FROM public.inventory_products ip
        JOIN (
            SELECT
                product_id,
                SUM(quantity) AS total_qty
            FROM jsonb_to_recordset(p_items)
            AS x(product_id uuid, quantity numeric)
            GROUP BY product_id
        ) grouped ON grouped.product_id = ip.id
        WHERE ip.is_active = true
        ORDER BY ip.id
        FOR UPDATE OF ip
    LOOP
        v_product_count := v_product_count + 1;

        IF v_product.current_stock < v_product.total_qty THEN
            RAISE EXCEPTION
                'Stok % tidak mencukupi. Tersedia %, dibutuhkan %.',
                v_product.product_name,
                v_product.current_stock,
                v_product.total_qty;
        END IF;

        v_hpp := v_hpp +
            (v_product.total_qty *
             COALESCE(v_product.purchase_price, 0));
    END LOOP;

    IF v_product_count <> v_expected_products THEN
        RAISE EXCEPTION
            'Ada barang yang tidak ditemukan atau tidak aktif di master persediaan.';
    END IF;

    v_hpp := round(v_hpp, 2);

    -- 5. Simpan header penjualan
    INSERT INTO public.store_sales (
        sale_number,
        sale_date,
        customer_name,
        payment_method,
        subtotal,
        discount,
        total,
        paid_amount,
        change_amount,
        status,
        notes,
        created_by
    )
    VALUES (
        v_sale_number,
        v_sale_date,
        COALESCE(NULLIF(trim(p_sale->>'customer_name'), ''), 'Pelanggan Umum'),
        v_payment_method,
        v_subtotal,
        v_discount,
        v_total,
        v_paid,
        v_change,
        'selesai',
        NULLIF(trim(p_sale->>'notes'), ''),
        v_user_id
    )
    RETURNING id INTO v_sale_id;

    -- 6. Simpan detail barang berdasarkan master persediaan
    FOR v_item IN
        SELECT *
        FROM jsonb_to_recordset(p_items)
        AS x(
            product_id uuid,
            quantity numeric,
            unit_price numeric
        )
    LOOP
        SELECT product_code, product_name, unit
        INTO v_product
        FROM public.inventory_products
        WHERE id = v_item.product_id
          AND is_active = true;

        v_line_total := round(
            v_item.quantity * v_item.unit_price, 2
        );

        INSERT INTO public.store_sale_items (
            sale_id,
            product_id,
            product_code,
            product_name,
            quantity,
            unit,
            unit_price,
            line_total
        )
        VALUES (
            v_sale_id,
            v_item.product_id,
            v_product.product_code,
            v_product.product_name,
            v_item.quantity,
            v_product.unit,
            v_item.unit_price,
            v_line_total
        );
    END LOOP;

    -- 7. Catat mutasi stok.
    -- Trigger inventory_movements yang mengubah current_stock.
    FOR v_product IN
        SELECT
            ip.id,
            ip.product_name,
            ip.current_stock,
            ip.purchase_price,
            grouped.total_qty
        FROM public.inventory_products ip
        JOIN (
            SELECT
                product_id,
                SUM(quantity) AS total_qty
            FROM jsonb_to_recordset(p_items)
            AS x(product_id uuid, quantity numeric)
            GROUP BY product_id
        ) grouped ON grouped.product_id = ip.id
        ORDER BY ip.id
    LOOP
        INSERT INTO public.inventory_movements (
            movement_number,
            product_id,
            movement_type,
            quantity,
            stock_before,
            stock_after,
            unit_cost,
            movement_date,
            reference_number,
            notes,
            created_by
        )
        VALUES (
            'JUAL-' ||
                to_char(v_sale_date, 'YYYYMMDD') || '-' ||
                upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
            v_product.id,
            'keluar',
            v_product.total_qty,
            v_product.current_stock,
            v_product.current_stock - v_product.total_qty,
            COALESCE(v_product.purchase_price, 0),
            v_sale_date::date,
            v_sale_number,
            'Pengeluaran stok otomatis transaksi toko',
            v_user_id
        );
    END LOOP;

    -- 8. Ambil akun jurnal
    SELECT id INTO v_account_cash
    FROM public.accounts
    WHERE kode_akun =
        CASE WHEN v_payment_method = 'tunai' THEN '1101' ELSE '1102' END
      AND aktif = true
    LIMIT 1;

    SELECT id INTO v_account_revenue
    FROM public.accounts
    WHERE kode_akun = '4101' AND aktif = true
    LIMIT 1;

    IF v_hpp > 0 THEN
        SELECT id INTO v_account_inventory
        FROM public.accounts
        WHERE kode_akun = '1104' AND aktif = true
        LIMIT 1;

        SELECT id INTO v_account_hpp
        FROM public.accounts
        WHERE kode_akun = '5104' AND aktif = true
        LIMIT 1;
    END IF;

    IF v_account_cash IS NULL OR v_account_revenue IS NULL THEN
        RAISE EXCEPTION 'Akun kas/bank atau pendapatan belum tersedia atau tidak aktif.';
    END IF;

    IF v_hpp > 0
       AND (v_account_inventory IS NULL OR v_account_hpp IS NULL) THEN
        RAISE EXCEPTION 'Akun persediaan atau HPP belum tersedia atau tidak aktif.';
    END IF;

    -- 9. Buat jurnal penjualan
    v_journal_number :=
        'JU-' || to_char(v_sale_date, 'YYYYMMDD') || '-' ||
        upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    INSERT INTO public.journal_entries (
        nomor_jurnal,
        tanggal,
        keterangan,
        status,
        created_by
    )
    VALUES (
        v_journal_number,
        v_sale_date::date,
        'Penjualan toko KDMP ' || v_sale_number,
        'draft',
        v_user_id
    )
    RETURNING id INTO v_journal_id;

    INSERT INTO public.journal_lines (
        journal_id, account_id, keterangan, debit, kredit
    )
    VALUES
    (
        v_journal_id,
        v_account_cash,
        'Penerimaan penjualan ' || v_sale_number,
        v_total,
        0
    ),
    (
        v_journal_id,
        v_account_revenue,
        'Pendapatan penjualan ' || v_sale_number,
        0,
        v_total
    );

    IF v_hpp > 0 THEN
        INSERT INTO public.journal_lines (
            journal_id, account_id, keterangan, debit, kredit
        )
        VALUES
        (
            v_journal_id,
            v_account_hpp,
            'HPP penjualan ' || v_sale_number,
            v_hpp,
            0
        ),
        (
            v_journal_id,
            v_account_inventory,
            'Pengurangan persediaan ' || v_sale_number,
            0,
            v_hpp
        );
    END IF;

    -- Memicu validasi keseimbangan jurnal yang sudah ada
    UPDATE public.journal_entries
    SET status = 'posted'
    WHERE id = v_journal_id;

    RETURN v_sale_id;
END;
$function$
;

REVOKE ALL ON FUNCTION public.proses_penjualan_toko_atomik(jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.proses_penjualan_toko_atomik(jsonb,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.catat_transaksi_keuangan(date,text,uuid,uuid,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.catat_transaksi_keuangan(date,text,uuid,uuid,numeric,text) TO authenticated;
REVOKE ALL ON FUNCTION public.record_invoice_journal(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_invoice_journal(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.record_invoice_payment(uuid,numeric,date,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_invoice_payment(uuid,numeric,date,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.pay_loan_installment(text,uuid,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_loan_installment(text,uuid,numeric,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.catat_jurnal_penjualan_toko(text,date,text,numeric,numeric,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.catat_jurnal_penjualan_toko(text,date,text,numeric,numeric,text) TO authenticated;
REVOKE ALL ON FUNCTION public.save_toko_sale_with_stock(jsonb,jsonb) FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inventory_products_current_stock_check'
      AND conrelid = 'public.inventory_products'::regclass
  ) THEN
    ALTER TABLE public.inventory_products
      ADD CONSTRAINT inventory_products_current_stock_check
      CHECK (current_stock >= 0) NOT VALID;
  END IF;
END;
$$;
ALTER TABLE public.inventory_products
  VALIDATE CONSTRAINT inventory_products_current_stock_check;
