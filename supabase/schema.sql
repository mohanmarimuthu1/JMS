-- ============================================================================
-- JMS Engineering — billing schema v2
-- See docs/DECISIONS.md for the full reasoning behind every choice here.
--
-- Design rules:
--   1. Tax documents (invoices, delivery challans) are append-only from the
--      client's point of view. No UPDATE, no DELETE policy exists for them —
--      the only way to write one is create_invoice()/create_dc() (functions.sql),
--      and the only way to void one is cancel_invoice()/cancel_dc(). This makes
--      "an issued invoice can't be edited" a property of the database, not of
--      the React code.
--   2. All money is numeric(12,2). All rounding happens once, in Postgres,
--      inside the create_* functions — never in the client, never twice.
--   3. Every number in the invoice_no / dc_no series is provably accounted
--      for as ISSUED, CANCELLED, or NOT ISSUED (invoice_register view) — a
--      gap is fine for a legal document, an *unexplained* gap is not.
--
-- Apply in this repo in order: schema.sql -> functions.sql -> policies.sql.
-- See supabase/README.md for how, and the dashboard checklist that isn't SQL.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- settings
-- Singleton row: id is fixed at 1, enforced by the check constraint, so
-- there's no ambiguity about "which row is the business profile".
create table settings (
  id            int primary key default 1 check (id = 1),
  name          text not null,
  address_line  text,
  cell          text,
  gstin         text,
  state_code    text not null default '33' check (state_code ~ '^[0-9]{2}$'),
  -- SGST %; CGST mirrors it for intra-state. 0 is a legal, reachable rate —
  -- the prototype's `settings.gstSplit || 9` made 0% impossible.
  gst_split     numeric(5,2) not null default 9 check (gst_split >= 0 and gst_split <= 50),
  jurisdiction  text,
  logo_url      text,
  updated_at    timestamptz not null default now()
);

insert into settings (id, name, address_line, cell, gstin, gst_split, jurisdiction)
values (
  1, 'JMS ENGINEERING',
  '1/2, 39-B-16, Aringar Anna Colony, SIDCO Industrial Estate, Coimbatore - 641 021.',
  '8610026754, 7708881444', '33BBJPJ1166M1ZJ', 9, 'Coimbatore'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------- customers
create table customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (btrim(name) <> ''),
  address     text,
  gstin       text check (
    gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$'
  ),
  -- Drives IGST vs SGST+CGST in create_invoice (functions.sql) — the
  -- GSTIN's state code, derived automatically so nothing has to
  -- remember to keep it in sync. See docs/DECISIONS.md #9.
  state_code  text generated always as (substring(gstin from 1 for 2)) stored,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Makes the prototype's duplicate-customer bug structurally impossible:
-- typing an existing customer's name (any case, any surrounding whitespace)
-- without using the autocomplete can no longer create a second row.
create unique index customers_name_uniq on customers (lower(btrim(name)));
create index customers_active_idx on customers (is_active) where is_active;

-- ---------------------------------------------------------------- items
create table items (
  id            uuid primary key default gen_random_uuid(),
  description   text not null check (btrim(description) <> ''),
  hsn           text,
  default_rate  numeric(12,2) check (default_rate is null or default_rate >= 0),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index items_desc_uniq on items (lower(btrim(description)));

-- ---------------------------------------------------------------- numbering
-- No paper bills have been issued yet under any series (confirmed with the
-- shop), so these start exactly where the original prototype's client-side
-- counters would have produced their first number — no bootstrap/setval
-- migration is needed. If that ever changes (e.g. restoring from an old
-- backup), see numbering_health() in functions.sql.
create sequence invoice_no_seq as int start with 101 minvalue 101;
create sequence dc_no_seq      as int start with 151 minvalue 151;

-- ---------------------------------------------------------- delivery challans
create table delivery_challans (
  dc_no             int primary key default nextval('dc_no_seq'),
  id                uuid not null unique default gen_random_uuid(),
  kind              text not null default 'dc' check (kind = 'dc'),
  date              date not null,
  ref_no            text,
  -- Matches the UI's closed 5-option select — free text was never actually
  -- possible in the app, the schema should say so too.
  purpose           text not null default 'Job work'
                      check (purpose in ('Job work', 'Sale on approval', 'Sales return',
                                         'Supply of goods', 'Other')),
  purpose_note      text,
  customer_id       uuid references customers(id) on delete set null,
  customer_snapshot jsonb not null,
  seller_snapshot   jsonb not null,
  status            text not null default 'issued' check (status in ('issued', 'cancelled')),
  cancelled_at      timestamptz,
  cancelled_reason  text,
  created_by        uuid,
  cancelled_by      uuid,
  created_at        timestamptz not null default now(),
  constraint dc_cancel_coherent check (
    (status = 'issued'    and cancelled_at is null     and cancelled_reason is null)
    or
    (status = 'cancelled' and cancelled_at is not null and btrim(coalesce(cancelled_reason, '')) <> '')
  ),
  constraint dc_purpose_note_required check (
    purpose <> 'Other' or btrim(coalesce(purpose_note, '')) <> ''
  )
);

create table dc_lines (
  id          uuid primary key default gen_random_uuid(),
  dc_no       int not null references delivery_challans(dc_no) on delete cascade,
  description text not null check (btrim(description) <> ''),
  hsn         text,
  qty         numeric(12,3) not null check (qty > 0),
  line_order  int not null,
  unique (dc_no, line_order)
);

-- ---------------------------------------------------------------- invoices
create table invoices (
  invoice_no        int primary key default nextval('invoice_no_seq'),
  id                uuid not null unique default gen_random_uuid(),
  kind              text not null default 'invoice' check (kind = 'invoice'),
  date              date not null,
  order_no          text,
  order_date        date,

  -- The invoice-to-challan link is a real FK, not free text of a different
  -- type than delivery_challans.dc_no (the prototype had `dc_no text` on
  -- the invoice vs `dc_no int` on the challan — an unqueryable type
  -- mismatch). on delete restrict: a challan that's been billed can't be
  -- cancelled out from under the invoice that references it (see
  -- cancel_dc() in functions.sql, which checks this explicitly first for a
  -- clearer error message).
  dc_id             uuid references delivery_challans(id) on delete restrict,

  customer_id       uuid references customers(id) on delete set null,
  customer_snapshot jsonb not null,
  -- Frozen at issue time, symmetric with customer_snapshot. The prototype
  -- froze the customer but read seller name/address/GSTIN live from
  -- settings at print time — so editing settings retroactively changed the
  -- appearance (including the GSTIN!) of every previously issued invoice.
  seller_snapshot   jsonb not null,

  -- IGST support (docs/DECISIONS.md #9) — added as nullable-by-default
  -- hooks in Slice 2, before IGST itself was built, so activating it
  -- later (which happened) needed no migration or constraint rewrite.
  place_of_supply   text not null default '33' check (place_of_supply ~ '^[0-9]{2}$'),
  supply_type       text not null default 'intra' check (supply_type in ('intra', 'inter')),

  subtotal          numeric(12,2) not null check (subtotal >= 0),
  sgst_pct          numeric(5,2)  not null default 0 check (sgst_pct >= 0),
  sgst              numeric(12,2) not null default 0 check (sgst >= 0),
  cgst_pct          numeric(5,2)  not null default 0 check (cgst_pct >= 0),
  cgst              numeric(12,2) not null default 0 check (cgst >= 0),
  igst_pct          numeric(5,2)  not null default 0 check (igst_pct >= 0),
  igst              numeric(12,2) not null default 0 check (igst >= 0),
  round_off         numeric(4,2)  not null default 0 check (round_off > -1 and round_off < 1),
  total             numeric(12,2) not null,
  -- Stored once, from the same whole-rupee `total` below, never
  -- recomputed at print time. See src/lib/money.ts for the client-side half
  -- of this decision and docs/DECISIONS.md #6 for the full rounding design.
  amount_in_words   text not null check (btrim(amount_in_words) <> ''),

  status            text not null default 'issued' check (status in ('issued', 'cancelled')),
  cancelled_at      timestamptz,
  cancelled_reason  text,
  created_by        uuid,
  cancelled_by      uuid,
  created_at        timestamptz not null default now(),

  -- The arithmetic itself is a constraint: a wrong total cannot be stored,
  -- including by a future bug, a manual SQL fix, or a restored backup.
  constraint inv_total_arith check (total = subtotal + sgst + cgst + igst + round_off),
  constraint inv_total_whole check (total = round(total, 0)),
  -- SGST/CGST and IGST on the same invoice — the classic implementation
  -- bug for a system supporting both tax modes — is structurally
  -- unstorable, enforced by the database rather than by create_invoice
  -- remembering to get it right.
  constraint inv_tax_mode check (
    (supply_type = 'intra' and igst_pct = 0 and igst = 0)
    or
    (supply_type = 'inter' and sgst_pct = 0 and sgst = 0 and cgst_pct = 0 and cgst = 0)
  ),
  constraint inv_cancel_coherent check (
    (status = 'issued'    and cancelled_at is null     and cancelled_reason is null)
    or
    (status = 'cancelled' and cancelled_at is not null and btrim(coalesce(cancelled_reason, '')) <> '')
  )
);

create table invoice_lines (
  id          uuid primary key default gen_random_uuid(),
  invoice_no  int not null references invoices(invoice_no) on delete cascade,
  description text not null check (btrim(description) <> ''),
  hsn         text,
  qty         numeric(12,3) not null check (qty > 0),
  rate        numeric(12,2) not null check (rate >= 0),
  -- Generated, not client-supplied: the printed line amount and the
  -- invoice subtotal are always computed from the same expression.
  amount      numeric(14,2) generated always as (round(qty * rate, 2)) stored,
  line_order  int not null,
  unique (invoice_no, line_order)
);

-- ---------------------------------------------------------------- indexes
create index invoices_hist_idx on invoices (date desc, invoice_no desc);
create index dc_hist_idx        on delivery_challans (date desc, dc_no desc);
create index invoices_cust_idx  on invoices (customer_id);
create index dc_cust_idx        on delivery_challans (customer_id);
create index invoices_dc_idx    on invoices (dc_id);
create index invoice_lines_idx  on invoice_lines (invoice_no);
create index dc_lines_idx       on dc_lines (dc_no);

-- ---------------------------------------------------------------- updated_at
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger t_settings_touch  before update on settings  for each row execute function touch_updated_at();
create trigger t_customers_touch before update on customers for each row execute function touch_updated_at();
create trigger t_items_touch     before update on items     for each row execute function touch_updated_at();

-- ---------------------------------------------------------------- views
-- security_invoker = true is mandatory on both views below. Without it,
-- the view runs with its owner's privileges and silently bypasses RLS —
-- exactly the SQL-editor-bypasses-RLS trap this whole design exists to
-- avoid (see docs/DECISIONS.md #4a).

-- Unified list for History (Slice 5). The prototype had no `kind` column
-- anywhere despite its print router depending on one; this supplies it for
-- free and flattens customer_snapshot->>'name' so nothing has to
-- dereference a possibly-null nested object client-side.
create or replace view documents with (security_invoker = true) as
select 'invoice'::text as kind, i.invoice_no as doc_no, i.id, i.date, i.status,
       i.customer_snapshot ->> 'name' as customer_name, i.total, i.created_at
from invoices i
union all
select 'dc'::text, d.dc_no, d.id, d.date, d.status,
       d.customer_snapshot ->> 'name', null::numeric, d.created_at
from delivery_challans d;

-- The audit artifact: every invoice_no in range is provably ISSUED,
-- CANCELLED, or NOT ISSUED. This one view is the entire answer to a GST
-- auditor's question about numbering gaps — see docs/DECISIONS.md #4f.
create or replace view invoice_register with (security_invoker = true) as
with bounds as (
  select min(invoice_no) as lo, max(invoice_no) as hi from invoices
)
select g.n as invoice_no,
       case when i.invoice_no is null   then 'NOT ISSUED'
            when i.status = 'cancelled' then 'CANCELLED'
            else 'ISSUED' end as status,
       i.date,
       i.customer_snapshot ->> 'name' as customer,
       case when i.status = 'issued' then i.total else 0 end as taxable_total,
       i.cancelled_reason
from bounds b
cross join generate_series(b.lo, b.hi) as g(n)
left join invoices i on i.invoice_no = g.n
order by g.n;
