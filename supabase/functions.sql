-- ============================================================================
-- JMS Engineering — write-path functions
-- Apply after schema.sql. See docs/DECISIONS.md for the reasoning.
--
-- Everything that mints an invoice/DC number or cancels one goes through a
-- function here. All validation happens BEFORE the INSERT that consumes a
-- number — nextval() fires at insert time, so an operator mistake (no
-- lines, no customer name, blank qty, an out-of-state GSTIN) costs zero
-- numbers. The only things that can still burn a number are a genuine bug
-- or the connection dying mid-transaction — both rare, and both fully
-- explained afterwards by invoice_register (schema.sql).
-- ============================================================================

-- ---------------------------------------------------------------- words
-- Indian crore/lakh/thousand system. Mirrors scripts/gen-fixtures.mjs's
-- wordsInr() exactly (that JS copy exists only to keep the committed
-- fixtures self-consistent — this is the one that actually runs in
-- production). Called once per invoice, inside create_invoice(), from the
-- same whole-rupee `total` that gets stored — never recomputed at print
-- time, so words and figure cannot drift apart.
create or replace function _words_below_1000(n int) returns text
language plpgsql immutable as $$
declare
  ones text[] := array['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  tens text[] := array['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  out text := '';
  h int; r int;
begin
  if n is null or n <= 0 then return ''; end if;
  h := n / 100; r := n % 100;
  if h > 0 then out := ones[h + 1] || ' Hundred'; end if;
  if r > 0 then
    if out <> '' then out := out || ' '; end if;
    if r < 20 then
      out := out || ones[r + 1];
    else
      out := out || tens[(r / 10) + 1] || case when r % 10 > 0 then ' ' || ones[(r % 10) + 1] else '' end;
    end if;
  end if;
  return out;
end $$;

create or replace function num_to_words_inr(p_amount numeric) returns text
language plpgsql immutable as $$
declare
  whole bigint := floor(abs(p_amount))::bigint;
  paise int := round((abs(p_amount) - floor(abs(p_amount))) * 100)::int;
  out text := '';
  crore int; lakh int; thou int; rest int;
begin
  if whole = 0 and paise = 0 then return 'Rupees Zero Only'; end if;
  crore := (whole / 10000000)::int; whole := whole % 10000000;
  lakh  := (whole / 100000)::int;   whole := whole % 100000;
  thou  := (whole / 1000)::int;     whole := whole % 1000;
  rest  := whole::int;
  if crore > 0 then out := out || _words_below_1000(crore) || ' Crore '; end if;
  if lakh  > 0 then out := out || _words_below_1000(lakh)  || ' Lakh ';  end if;
  if thou  > 0 then out := out || _words_below_1000(thou)  || ' Thousand '; end if;
  if rest  > 0 then out := out || _words_below_1000(rest); end if;
  out := 'Rupees ' || btrim(regexp_replace(out, '\s+', ' ', 'g'));
  if paise > 0 then out := out || ' and ' || _words_below_1000(paise) || ' Paise'; end if;
  return out || ' Only';
end $$;

-- ---------------------------------------------------------- customer upsert
-- Structural fix for the prototype's worst real-world data-quality bug:
-- typing an existing customer's exact name without clicking the
-- autocomplete row created a duplicate customer every time. Here, the
-- unique index on lower(btrim(name)) (schema.sql) makes that a conflict
-- this function resolves by updating, not duplicating.
create or replace function find_or_create_customer(
  p_name text, p_address text, p_gstin text, p_id uuid default null
) returns customers
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_cust customers;
  v_name text;
begin
  if p_id is not null then
    select * into v_cust from customers where id = p_id;
    if found then return v_cust; end if;
  end if;

  if btrim(coalesce(p_name, '')) = '' then
    raise exception 'Customer name is required' using errcode = 'JMS05';
  end if;

  -- Strips a leading salutation ("Mr Ganesan" -> "Ganesan"). Mirrors
  -- src/lib/validation.ts's stripHonorificPrefix — enforced here too so
  -- it's authoritative regardless of client version or entry path.
  v_name := regexp_replace(btrim(p_name), '^(mr|mrs|ms|miss|shri|smt|dr)\.?\s+', '', 'i');

  insert into customers (name, address, gstin)
  values (v_name, nullif(btrim(coalesce(p_address, '')), ''), p_gstin)
  on conflict (lower(btrim(name))) do update
    set address   = coalesce(nullif(btrim(coalesce(excluded.address, '')), ''), customers.address),
        gstin     = coalesce(excluded.gstin, customers.gstin),
        is_active = true
  returning * into v_cust;

  return v_cust;
end $$;

-- ---------------------------------------------------------------- invoice
create or replace function create_invoice(payload jsonb)
returns table (invoice_no int, id uuid, total numeric, amount_in_words text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_settings  settings;
  v_cust      customers;
  v_lines     jsonb;
  v_no        int;
  v_id        uuid;
  v_cust_snap jsonb;
  v_sgst_pct   numeric(5,2);
  v_cgst_pct   numeric(5,2);
  v_igst_pct   numeric(5,2);
  v_subtotal   numeric(12,2);
  v_sgst       numeric(12,2);
  v_cgst       numeric(12,2);
  v_igst       numeric(12,2);
  v_gross      numeric(14,4);
  v_total      numeric(12,2);
  v_round_off  numeric(4,2);
  v_words      text;
  v_pos        text;
  v_supply_type text;
  v_force_inter boolean;
  v_date       date;
  v_dc_id      uuid;
begin
  -- ===== ALL VALIDATION HAPPENS BEFORE THE INSERT =========================
  select * into v_settings from settings where settings.id = 1;
  if v_settings.id is null then
    raise exception 'Business settings are not configured' using errcode = 'JMS01';
  end if;

  v_date := coalesce(nullif(btrim(coalesce(payload ->> 'date', '')), '')::date, current_date);

  -- Drop blank lines; coerce '' -> null; require qty > 0. This is where the
  -- prototype's `orderDate: ""` / `defaultRate: ""` boundary problem is
  -- solved once, server-side, instead of at every client call site.
  select coalesce(jsonb_agg(l order by ord), '[]'::jsonb) into v_lines
  from jsonb_array_elements(coalesce(payload -> 'lines', '[]'::jsonb)) with ordinality t(l, ord)
  where btrim(coalesce(l ->> 'description', '')) <> ''
    and coalesce(nullif(btrim(coalesce(l ->> 'qty', '')), '')::numeric, 0) > 0;

  if jsonb_array_length(v_lines) = 0 then
    raise exception 'An invoice needs at least one line with a description and a quantity' using errcode = 'JMS02';
  end if;

  v_cust := find_or_create_customer(
    payload -> 'customer' ->> 'name',
    payload -> 'customer' ->> 'address',
    nullif(btrim(upper(coalesce(payload -> 'customer' ->> 'gstin', ''))), ''),
    nullif(payload ->> 'customer_id', '')::uuid
  );

  -- Place of supply drives which tax applies — not a warning anymore.
  -- Originally this hard-blocked out-of-state customers because IGST
  -- wasn't built (docs/DECISIONS.md #5 called it a deferred feature on
  -- the assumption inter-state orders were rare/nonexistent for this
  -- shop). Confirmed with the shop that they do happen, so it's built
  -- for real below instead of deferred further. A customer with no
  -- GSTIN has no determinable registered state, so falls back to
  -- intra-state — see the note on v_pos's use in the IGST comment.
  --
  -- `force_interstate` is a manual operator override (the form's "Other
  -- state order" checkbox) for exactly that no-GSTIN case: it can only
  -- push supply_type to 'inter', never override a real GSTIN-derived
  -- state back down to 'intra'. place_of_supply still falls back to the
  -- seller's own state code when the customer has no GSTIN, since there
  -- is no other source for it on this form.
  v_pos := coalesce(v_cust.state_code, v_settings.state_code);
  v_force_inter := coalesce((payload ->> 'force_interstate')::boolean, false);
  v_supply_type := case when v_force_inter or v_pos <> v_settings.state_code then 'inter' else 'intra' end;

  v_dc_id := nullif(payload ->> 'dc_id', '')::uuid;
  if v_dc_id is not null then
    -- Qualified deliberately: `id` is ambiguous here otherwise, because
    -- create_invoice's own `returns table (..., id uuid, ...)` puts a
    -- plpgsql variable named `id` in scope for the whole function body,
    -- which collides with delivery_challans.id in this bare WHERE clause.
    perform 1 from delivery_challans where delivery_challans.id = v_dc_id and status = 'issued';
    if not found then
      raise exception 'Delivery challan not found, or it has been cancelled' using errcode = 'JMS04';
    end if;
  end if;

  -- ===== MONEY: computed here, never trusted from the client ==============
  select coalesce(sum(round((l ->> 'qty')::numeric * coalesce(nullif(btrim(l ->> 'rate'), '')::numeric, 0), 2)), 0)
    into v_subtotal
  from jsonb_array_elements(v_lines) l;

  if v_supply_type = 'inter' then
    -- IGST replaces SGST+CGST, not on top of it — same total tax rate
    -- (SGST% + CGST% = IGST%), just collected under one head instead of
    -- two, per standard GST practice for inter-state supply. The
    -- inv_tax_mode CHECK constraint in schema.sql makes it structurally
    -- impossible to store both SGST/CGST and IGST on the same invoice.
    v_sgst_pct := 0; v_sgst := 0;
    v_cgst_pct := 0; v_cgst := 0;
    v_igst_pct := coalesce(nullif(btrim(coalesce(payload ->> 'igst_pct', '')), '')::numeric, v_settings.gst_split * 2);
    v_igst     := round(v_subtotal * v_igst_pct / 100, 2);
  else
    v_sgst_pct := coalesce(nullif(btrim(coalesce(payload ->> 'sgst_pct', '')), '')::numeric, v_settings.gst_split);
    v_cgst_pct := coalesce(nullif(btrim(coalesce(payload ->> 'cgst_pct', '')), '')::numeric, v_settings.gst_split);
    v_sgst     := round(v_subtotal * v_sgst_pct / 100, 2);
    v_cgst     := round(v_subtotal * v_cgst_pct / 100, 2);
    v_igst_pct := 0; v_igst := 0;
  end if;

  v_gross     := v_subtotal + v_sgst + v_cgst + v_igst;
  v_total     := round(v_gross, 0);
  v_round_off := v_total - v_gross;
  v_words     := num_to_words_inr(v_total);

  v_cust_snap := jsonb_build_object('name', v_cust.name, 'address', v_cust.address, 'gstin', v_cust.gstin);

  -- ===== THE ONLY STATEMENT THAT CONSUMES A NUMBER =========================
  insert into invoices (
    date, order_no, order_date, dc_id,
    customer_id, customer_snapshot, seller_snapshot,
    place_of_supply, supply_type,
    subtotal, sgst_pct, sgst, cgst_pct, cgst, igst_pct, igst, round_off, total, amount_in_words,
    created_by
  ) values (
    v_date,
    nullif(btrim(coalesce(payload ->> 'order_no', '')), ''),
    nullif(btrim(coalesce(payload ->> 'order_date', '')), '')::date,
    v_dc_id,
    v_cust.id, v_cust_snap,
    jsonb_build_object('name', v_settings.name, 'address_line', v_settings.address_line,
                        'cell', v_settings.cell, 'gstin', v_settings.gstin,
                        'jurisdiction', v_settings.jurisdiction, 'logo_url', v_settings.logo_url),
    v_pos, v_supply_type,
    v_subtotal, v_sgst_pct, v_sgst, v_cgst_pct, v_cgst, v_igst_pct, v_igst, v_round_off, v_total, v_words,
    auth.uid()
  )
  returning invoices.invoice_no, invoices.id into v_no, v_id;

  insert into invoice_lines (invoice_no, description, hsn, qty, rate, line_order)
  select v_no,
         btrim(l ->> 'description'),
         nullif(btrim(coalesce(l ->> 'hsn', '')), ''),
         (l ->> 'qty')::numeric,
         coalesce(nullif(btrim(coalesce(l ->> 'rate', '')), '')::numeric, 0),
         ord
  from jsonb_array_elements(v_lines) with ordinality t(l, ord);

  -- Learn the item master. on conflict do nothing (schema.sql's unique
  -- index) replaces the prototype's JS dedupe-by-exact-case-insensitive-
  -- match, which raced under concurrent writers.
  insert into items (description, hsn, default_rate)
  select distinct on (lower(btrim(l ->> 'description')))
         btrim(l ->> 'description'),
         nullif(btrim(coalesce(l ->> 'hsn', '')), ''),
         nullif(btrim(coalesce(l ->> 'rate', '')), '')::numeric
  from jsonb_array_elements(v_lines) l
  on conflict do nothing;

  return query select v_no, v_id, v_total, v_words;
end $$;

-- ---------------------------------------------------------------- DC
create or replace function create_dc(payload jsonb)
returns table (dc_no int, id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_settings  settings;
  v_cust      customers;
  v_lines     jsonb;
  v_no        int;
  v_id        uuid;
  v_cust_snap jsonb;
  v_date      date;
  v_purpose   text;
  v_note      text;
begin
  select * into v_settings from settings where settings.id = 1;
  if v_settings.id is null then
    raise exception 'Business settings are not configured' using errcode = 'JMS01';
  end if;

  v_date := coalesce(nullif(btrim(coalesce(payload ->> 'date', '')), '')::date, current_date);

  select coalesce(jsonb_agg(l order by ord), '[]'::jsonb) into v_lines
  from jsonb_array_elements(coalesce(payload -> 'lines', '[]'::jsonb)) with ordinality t(l, ord)
  where btrim(coalesce(l ->> 'description', '')) <> ''
    and coalesce(nullif(btrim(coalesce(l ->> 'qty', '')), '')::numeric, 0) > 0;

  if jsonb_array_length(v_lines) = 0 then
    raise exception 'A delivery challan needs at least one line with a description and a quantity' using errcode = 'JMS02';
  end if;

  v_cust := find_or_create_customer(
    payload -> 'customer' ->> 'name',
    payload -> 'customer' ->> 'address',
    nullif(btrim(upper(coalesce(payload -> 'customer' ->> 'gstin', ''))), ''),
    nullif(payload ->> 'customer_id', '')::uuid
  );

  v_purpose := coalesce(nullif(btrim(coalesce(payload ->> 'purpose', '')), ''), 'Job work');
  v_note    := nullif(btrim(coalesce(payload ->> 'purpose_note', '')), '');
  if v_purpose = 'Other' and v_note is null then
    raise exception 'A note is required when purpose is "Other"' using errcode = 'JMS06';
  end if;

  v_cust_snap := jsonb_build_object('name', v_cust.name, 'address', v_cust.address, 'gstin', v_cust.gstin);

  insert into delivery_challans (
    date, ref_no, purpose, purpose_note,
    customer_id, customer_snapshot, seller_snapshot, created_by
  ) values (
    v_date,
    nullif(btrim(coalesce(payload ->> 'ref_no', '')), ''),
    v_purpose, v_note,
    v_cust.id, v_cust_snap,
    jsonb_build_object('name', v_settings.name, 'address_line', v_settings.address_line,
                        'cell', v_settings.cell, 'gstin', v_settings.gstin,
                        'jurisdiction', v_settings.jurisdiction, 'logo_url', v_settings.logo_url),
    auth.uid()
  )
  returning delivery_challans.dc_no, delivery_challans.id into v_no, v_id;

  insert into dc_lines (dc_no, description, hsn, qty, line_order)
  select v_no,
         btrim(l ->> 'description'),
         nullif(btrim(coalesce(l ->> 'hsn', '')), ''),
         (l ->> 'qty')::numeric,
         ord
  from jsonb_array_elements(v_lines) with ordinality t(l, ord);

  insert into items (description, hsn)
  select distinct on (lower(btrim(l ->> 'description')))
         btrim(l ->> 'description'),
         nullif(btrim(coalesce(l ->> 'hsn', '')), '')
  from jsonb_array_elements(v_lines) l
  on conflict do nothing;

  return query select v_no, v_id;
end $$;

-- ---------------------------------------------------------------- cancel
create or replace function cancel_invoice(p_invoice_no int, p_reason text)
returns invoices
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inv invoices;
begin
  if btrim(coalesce(p_reason, '')) = '' then
    raise exception 'A cancellation reason is required' using errcode = 'JMS10';
  end if;

  select * into v_inv from invoices where invoice_no = p_invoice_no for update;
  if not found then
    raise exception 'Invoice % does not exist', p_invoice_no using errcode = 'JMS11';
  end if;
  if v_inv.status = 'cancelled' then
    return v_inv; -- idempotent: a double-click is harmless
  end if;

  update invoices
     set status = 'cancelled', cancelled_at = now(),
         cancelled_reason = btrim(p_reason), cancelled_by = auth.uid()
   where invoice_no = p_invoice_no
  returning * into v_inv;

  return v_inv;
end $$;

create or replace function cancel_dc(p_dc_no int, p_reason text)
returns delivery_challans
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_dc delivery_challans; v_inv int;
begin
  if btrim(coalesce(p_reason, '')) = '' then
    raise exception 'A cancellation reason is required' using errcode = 'JMS10';
  end if;

  select * into v_dc from delivery_challans where dc_no = p_dc_no for update;
  if not found then
    raise exception 'Delivery challan % does not exist', p_dc_no using errcode = 'JMS11';
  end if;
  if v_dc.status = 'cancelled' then
    return v_dc;
  end if;

  -- A DC that's already been billed can't be cancelled out from under its
  -- invoice — checked here first so the error is legible, even though the
  -- FK's `on delete restrict` would also stop a hard delete.
  select i.invoice_no into v_inv from invoices i where i.dc_id = v_dc.id and i.status = 'issued' limit 1;
  if v_inv is not null then
    raise exception 'DC % is billed on invoice %. Cancel that invoice first.', p_dc_no, v_inv using errcode = 'JMS12';
  end if;

  update delivery_challans
     set status = 'cancelled', cancelled_at = now(),
         cancelled_reason = btrim(p_reason), cancelled_by = auth.uid()
   where dc_no = p_dc_no
  returning * into v_dc;

  return v_dc;
end $$;

-- ---------------------------------------------------------------- health
-- "Check numbering health" (Settings, Slice 6). Costs nothing and catches
-- the realistic way this breaks: a botched restore-from-backup that leaves
-- the sequence behind the data it's supposed to be ahead of.
create or replace function numbering_health()
returns table (problem text, detail text)
language sql stable security definer set search_path = public, pg_temp as $$
  select 'DUPLICATE_INVOICE_NO', invoice_no::text
  from invoices group by invoice_no having count(*) > 1
  union all
  select 'INVOICE_SEQ_BEHIND_DATA',
         format('max(invoice_no)=%s but sequence next value is %s',
                (select max(invoice_no) from invoices),
                (select last_value + 1 from invoice_no_seq))
  where (select max(invoice_no) from invoices) is not null
    and (select max(invoice_no) from invoices) >= (select last_value from invoice_no_seq)
  union all
  select 'ORPHAN_INVOICE_HEADER', invoice_no::text
  from invoices i
  where not exists (select 1 from invoice_lines l where l.invoice_no = i.invoice_no);
$$;
