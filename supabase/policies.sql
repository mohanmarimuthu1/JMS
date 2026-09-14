-- ============================================================================
-- JMS Engineering — RLS policies + grants
-- Apply after schema.sql and functions.sql. See docs/DECISIONS.md #4a/#4b.
--
-- The organizing principle: the client gets SELECT on tax documents and
-- NOTHING else. Every write goes through a SECURITY DEFINER function
-- (functions.sql), which bypasses RLS by design — so the absence of an
-- insert/update/delete policy on invoices/delivery_challans/*_lines below
-- is not an oversight, it's the entire mechanism that makes "an issued
-- invoice can't be edited" true no matter what the client code does.
--
-- This file alone is NOT enough. Supabase's project defaults grant broad
-- access independent of RLS — see the dashboard checklist in
-- supabase/README.md, none of which is SQL and all of which matters.
-- ============================================================================

-- ---------------------------------------------------------------- revoke first
-- Revoking at the grant layer, not just the policy layer, means a future
-- `create policy ... for update` added by mistake still can't mutate an
-- issued invoice — there's no grant for it to exercise.
revoke all on sequence invoice_no_seq, dc_no_seq from anon, authenticated, public;
revoke all on all tables    in schema public from anon;
revoke all on all functions in schema public from anon, public;

revoke insert, update, delete on invoices, invoice_lines, delivery_challans, dc_lines
  from authenticated;
grant  select on invoices, invoice_lines, delivery_challans, dc_lines,
                  documents, invoice_register
  to authenticated;

grant select, insert, update on customers, items to authenticated;
revoke delete on customers, items from authenticated;

grant select, update on settings to authenticated;
revoke insert, delete on settings from authenticated;

grant execute on function
  create_invoice(jsonb),
  create_dc(jsonb),
  cancel_invoice(int, text),
  cancel_dc(int, text),
  numbering_health()
to authenticated;

-- find_or_create_customer / num_to_words_inr / _words_below_1000 are
-- internal helpers called BY create_invoice/create_dc under SECURITY
-- DEFINER — they don't need, and don't get, a direct grant to authenticated.

-- ---------------------------------------------------------------- enable RLS
alter table settings          enable row level security;
alter table customers         enable row level security;
alter table items             enable row level security;
alter table invoices          enable row level security;
alter table invoice_lines     enable row level security;
alter table delivery_challans enable row level security;
alter table dc_lines          enable row level security;

-- ---------------------------------------------------------------- settings
create policy settings_read on settings for select to authenticated using (true);
create policy settings_edit on settings for update to authenticated using (id = 1) with check (id = 1);

-- ---------------------------------------------------------------- customers / items
-- Full CRUD except delete — archive via is_active instead (schema.sql).
create policy customers_read   on customers for select to authenticated using (true);
create policy customers_insert on customers for insert to authenticated with check (true);
create policy customers_update on customers for update to authenticated using (true) with check (true);

create policy items_read   on items for select to authenticated using (true);
create policy items_insert on items for insert to authenticated with check (true);
create policy items_update on items for update to authenticated using (true) with check (true);

-- ---------------------------------------------------------------- tax documents
-- SELECT ONLY. Deliberately no insert/update/delete policy — see the
-- header comment. This is the legal immutability, enforced by the
-- database, not by React remembering not to call the wrong endpoint.
create policy invoices_read      on invoices          for select to authenticated using (true);
create policy invoice_lines_read on invoice_lines     for select to authenticated using (true);
create policy dc_read            on delivery_challans for select to authenticated using (true);
create policy dc_lines_read      on dc_lines          for select to authenticated using (true);
