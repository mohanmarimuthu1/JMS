# Plan — JMS Engineering Billing System (Supabase + React)

> Work phase by phase, in order. Do not start a phase until the previous phase's Exit criteria pass. Update this file's checkboxes as tasks complete.

## Context

Family lathe/precision-engineering business (JMS Engineering, Coimbatore). Replaces a paper invoice/DC book. Single-file React prototype already exists (`billing-system.jsx`) with the full UI, print templates matching the physical bill, and a logo asset — use it as the UI reference, not the final architecture. This plan rebuilds it on Supabase for real persistence and multi-device use (shop floor + office).

**Non-negotiable:** invoice and DC numbers must never collide or skip unpredictably — this is a legal tax document. Use DB sequences, not client-side counters.

**Target bar:** works reliably on a shared shop PC and phone browsers, survives spotty internet, one non-technical operator (father) can use it without training beyond initial walkthrough.

---

## Phase 0 — Project setup
- [ ] Vite + React app scaffolded
- [ ] Tailwind configured
- [ ] Supabase project created, `supabase-schema.sql` applied
- [ ] `@supabase/supabase-js` client wired with env vars
- [ ] Deployed skeleton to Vercel (blank page is fine)

**Exit criteria:** app builds, deploys, connects to Supabase (verify with one test insert via SQL editor).

## Phase 1 — Auth
- [ ] Simple auth: single shared login (Supabase email/password) for the business — no public signup
- [ ] RLS policies scoped to authenticated role
- [ ] Session persists across reloads

**Exit criteria:** logged-out users see nothing; logged-in session survives a refresh.
**Risk:** don't over-engineer this — it's one family business, not multi-tenant. Skip role-based permissions unless asked.

## Phase 2 — Customers & Items master
- [ ] Customer CRUD (list, add, edit, delete) against `customers` table
- [ ] Item master CRUD against `items` table
- [ ] Both support inline autocomplete (as in the prototype)

**Exit criteria:** data survives a page reload and a different browser/device (proves Supabase round-trip, not localStorage).
**Depends on:** Phase 1.

## Phase 3 — Invoice creation
- [ ] Invoice form (customer, date, order no/date, DC no/date, line items)
- [ ] Invoice numbering via `invoice_no_seq` (DB-generated, not client counter)
- [ ] Auto-save new customers/items typed fresh into master tables
- [ ] Totals calc (subtotal, SGST, CGST, total) — GST % from `settings`
- [ ] Insert into `invoices` + `invoice_lines`

**Exit criteria:** two invoices created back-to-back from two different browser tabs never get the same invoice number.
**Depends on:** Phase 2.

## Phase 4 — Delivery Challan
- [ ] DC form (customer, date, ref/order no, purpose, line items — no GST)
- [ ] DC numbering via `dc_no_seq`
- [ ] Insert into `delivery_challans` + `dc_lines`

**Exit criteria:** same numbering-safety test as Phase 3, run against DC sequence.
**Depends on:** Phase 2. Can run in parallel with Phase 3 — no shared dependency between them.

## Phase 5 — History
- [ ] Unified list of invoices + DCs, newest first
- [ ] Search by customer name / document number
- [ ] Filter by type (invoice / DC / all)
- [ ] Delete with confirmation

**Exit criteria:** searching/filtering works against real Supabase data, not an in-memory array.
**Depends on:** Phases 3 and 4.

## Phase 6 — Print templates
- [ ] Port the prototype's print layout exactly (bordered box structure matching the physical bill)
- [ ] Logo — move from base64-embed to Supabase Storage bucket, fetch by URL
- [ ] Amount-in-words, signature block, seal placeholder — carry over unchanged
- [ ] Browser print → Save as PDF confirmed working on both desktop and mobile

**Exit criteria:** a printed invoice and DC are visually indistinguishable from the current prototype's output, side by side.
**Depends on:** Phases 3, 4.

## Phase 7 — Settings
- [ ] Business settings form (name, address, cell, GSTIN, GST split, jurisdiction) → `settings` table
- [ ] Logo upload UI → Supabase Storage, updates `settings.logo_url`

**Exit criteria:** changing a setting reflects immediately in the next print preview.
**Depends on:** Phase 6 (logo storage).

## Phase 8 — Reliability & deploy
- [ ] Handle offline/slow-connection gracefully (disable submit + spinner, no silent data loss)
- [ ] Basic error toast on failed Supabase writes — never fail silently on a save
- [ ] PWA manifest so it installs on the shop phone/tablet
- [ ] Final deploy + a written one-page "how to make a bill" note for the person who'll actually use it day to day

**Exit criteria:** you can hand the phone to your father and he can make an invoice without calling you.

---

## Critical path
Phase 0 → 1 → 2 → (3 ∥ 4) → 5 → 6 → 7 → 8

## Biggest risk
Sequence-based numbering under concurrent access (two people billing at once on shop wifi) — test this explicitly in Phases 3 and 4, don't assume it just works because Postgres sequences are "supposed to."
