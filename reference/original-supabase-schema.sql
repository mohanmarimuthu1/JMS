-- JMS Engineering billing system — Supabase schema

create table settings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address_line text,
  cell text,
  gstin text,
  gst_split numeric default 9,
  jurisdiction text,
  logo_url text,
  updated_at timestamptz default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  gstin text,
  created_at timestamptz default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  hsn text,
  default_rate numeric,
  unit text,
  created_at timestamptz default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no int not null unique,
  date date not null,
  order_no text,
  order_date date,
  dc_no text,
  dc_date date,
  customer_id uuid references customers(id),
  customer_snapshot jsonb not null, -- {name, address, gstin} at time of billing
  subtotal numeric not null,
  sgst_pct numeric not null,
  sgst numeric not null,
  cgst_pct numeric not null,
  cgst numeric not null,
  total numeric not null,
  created_at timestamptz default now()
);

create table invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  description text not null,
  hsn text,
  qty numeric not null,
  rate numeric not null,
  line_order int not null
);

create table delivery_challans (
  id uuid primary key default gen_random_uuid(),
  dc_no int not null unique,
  date date not null,
  ref_no text,
  purpose text,
  customer_id uuid references customers(id),
  customer_snapshot jsonb not null,
  created_at timestamptz default now()
);

create table dc_lines (
  id uuid primary key default gen_random_uuid(),
  dc_id uuid references delivery_challans(id) on delete cascade,
  description text not null,
  hsn text,
  qty numeric not null,
  line_order int not null
);

-- Auto-incrementing invoice/DC numbers without race conditions
create sequence invoice_no_seq start 100;
create sequence dc_no_seq start 150;

-- Helpful indexes
create index on invoices (customer_id);
create index on delivery_challans (customer_id);
create index on invoice_lines (invoice_id);
create index on dc_lines (dc_id);

-- RLS: enable and scope to authenticated business users once auth is added
alter table settings enable row level security;
alter table customers enable row level security;
alter table items enable row level security;
alter table invoices enable row level security;
alter table invoice_lines enable row level security;
alter table delivery_challans enable row level security;
alter table dc_lines enable row level security;
