-- DAGBOEK role-based RLS policy baseline
-- Role matrix:
-- manajer: full access
-- admin_keuangan: accounting, invoices, AR/AP, bank, savings/loan payments
-- kasir: POS and product lookup only
-- admin_gudang: inventory and stock movement
-- pengurus: read-only financial/operational overview
-- Prepared for review; do not apply to production until role tests pass.

CREATE OR REPLACE FUNCTION public.has_active_cooperative_membership(
  p_cooperative_id uuid,
  p_required_role text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.cooperative_memberships cm
    WHERE cm.cooperative_id = p_cooperative_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
      AND EXISTS (
        SELECT 1 FROM public.profiles pr
        WHERE pr.id = cm.user_id AND pr.role = cm.role
      )
      AND (p_required_role IS NULL OR cm.role = p_required_role)
  );
$function$;

REVOKE ALL ON FUNCTION public.has_active_cooperative_membership(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_cooperative_membership(uuid,text) TO authenticated;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY[
        'financial_transactions','journal_entries','journal_lines',
        'inventory_products','inventory_movements','store_sales','store_sale_items',
        'invoices','invoice_items','invoice_payments',
        'business_partners','ar_ap_documents','ar_ap_payments',
        'cooperative_members','cooperative_finance_settings',
        'member_savings_transactions','member_loans','loan_installments',
        'loan_installment_payments','operational_daily_logs',
        'bank_reconciliations','bank_reconciliation_items',
        'cooperatives','cooperative_memberships','cooperative_invitations'
      ])
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END;
$$;

-- Financial records
CREATE POLICY financial_transactions_read ON public.financial_transactions
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan','pengurus'));
CREATE POLICY financial_transactions_write ON public.financial_transactions
FOR ALL TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));

CREATE POLICY journal_entries_read ON public.journal_entries
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan','pengurus'));
CREATE POLICY journal_entries_write ON public.journal_entries
FOR ALL TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));

CREATE POLICY journal_lines_read ON public.journal_lines
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan','pengurus'));
CREATE POLICY journal_lines_write ON public.journal_lines
FOR ALL TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));

-- Inventory: stock is changed only by inventory movement trigger/RPC.
CREATE POLICY inventory_products_read ON public.inventory_products
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_gudang','kasir','admin_keuangan','pengurus'));
CREATE POLICY inventory_products_insert ON public.inventory_products
FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('manajer','admin_gudang'));
CREATE POLICY inventory_products_update ON public.inventory_products
FOR UPDATE TO authenticated
USING (public.current_user_role() IN ('manajer','admin_gudang'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_gudang'));
CREATE POLICY inventory_products_delete ON public.inventory_products
FOR DELETE TO authenticated
USING (public.current_user_role() = 'manajer');

CREATE POLICY inventory_movements_read ON public.inventory_movements
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_gudang','kasir','admin_keuangan','pengurus'));
CREATE POLICY inventory_movements_insert ON public.inventory_movements
FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('manajer','admin_gudang'));

-- POS rows are written only through the atomic sale/cancellation RPCs.
CREATE POLICY store_sales_read ON public.store_sales
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','kasir','admin_keuangan','pengurus'));
CREATE POLICY store_sale_items_read ON public.store_sale_items
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','kasir','admin_keuangan','pengurus'));

-- Invoices are maintained by finance; payments are written by a guarded RPC.
CREATE POLICY invoices_read ON public.invoices
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'));
CREATE POLICY invoices_insert ON public.invoices
FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));
CREATE POLICY invoices_delete_failed_create ON public.invoices
FOR DELETE TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'));

CREATE POLICY invoice_items_read ON public.invoice_items
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'));
CREATE POLICY invoice_items_insert ON public.invoice_items
FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));
CREATE POLICY invoice_payments_read ON public.invoice_payments
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'));

-- Accounts payable/receivable and counterparties.
CREATE POLICY business_partners_access ON public.business_partners
FOR ALL TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));
CREATE POLICY ar_ap_documents_access ON public.ar_ap_documents
FOR ALL TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));
CREATE POLICY ar_ap_payments_access ON public.ar_ap_payments
FOR ALL TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));

-- Members, savings, and loans.
CREATE POLICY cooperative_members_read ON public.cooperative_members
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan','kasir','pengurus'));
CREATE POLICY cooperative_members_write ON public.cooperative_members
FOR ALL TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));

CREATE POLICY cooperative_finance_settings_access ON public.cooperative_finance_settings
FOR ALL TO authenticated
USING (public.current_user_role() = 'manajer')
WITH CHECK (public.current_user_role() = 'manajer');

CREATE POLICY member_savings_read ON public.member_savings_transactions
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan','pengurus'));
CREATE POLICY member_savings_insert ON public.member_savings_transactions
FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));

CREATE POLICY member_loans_read ON public.member_loans
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan','pengurus'));
CREATE POLICY member_loans_insert ON public.member_loans
FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));
CREATE POLICY member_loans_update ON public.member_loans
FOR UPDATE TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));

CREATE POLICY loan_installments_read ON public.loan_installments
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan','pengurus'));
CREATE POLICY loan_installments_insert ON public.loan_installments
FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() = 'manajer');
CREATE POLICY loan_installments_update ON public.loan_installments
FOR UPDATE TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));

CREATE POLICY loan_installment_payments_read ON public.loan_installment_payments
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan','pengurus'));
CREATE POLICY loan_installment_payments_insert ON public.loan_installment_payments
FOR INSERT TO authenticated
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));

-- Operational daily logs: users can create their own; manager controls maintenance.
CREATE POLICY operational_logs_read ON public.operational_daily_logs
FOR SELECT TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan','pengurus'));
CREATE POLICY operational_logs_insert ON public.operational_daily_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);
CREATE POLICY operational_logs_update ON public.operational_daily_logs
FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.current_user_role() = 'manajer')
WITH CHECK (created_by = auth.uid() OR public.current_user_role() = 'manajer');
CREATE POLICY operational_logs_delete ON public.operational_daily_logs
FOR DELETE TO authenticated
USING (public.current_user_role() = 'manajer');

-- Bank reconciliation.
CREATE POLICY bank_reconciliations_access ON public.bank_reconciliations
FOR ALL TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));
CREATE POLICY bank_reconciliation_items_access ON public.bank_reconciliation_items
FOR ALL TO authenticated
USING (public.current_user_role() IN ('manajer','admin_keuangan'))
WITH CHECK (public.current_user_role() IN ('manajer','admin_keuangan'));

-- Cooperative directory and invitations. Membership writes are reserved for server-side invitation flow.
CREATE POLICY cooperatives_member_read ON public.cooperatives
FOR SELECT TO authenticated
USING (public.has_active_cooperative_membership(id));
CREATE POLICY cooperatives_manager_update ON public.cooperatives
FOR UPDATE TO authenticated
USING (public.has_active_cooperative_membership(id,'manajer'))
WITH CHECK (public.has_active_cooperative_membership(id,'manajer'));

CREATE POLICY cooperative_memberships_self_or_manager_read ON public.cooperative_memberships
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_active_cooperative_membership(cooperative_id,'manajer'));

CREATE POLICY cooperative_invitations_manager_read ON public.cooperative_invitations
FOR SELECT TO authenticated
USING (public.has_active_cooperative_membership(cooperative_id,'manajer'));
