# Progress

Status tracker for the slices described in `docs/DECISIONS.md`. Updated
as work lands; each entry links the commit/PR that closed it once merged.

## Slice 0 — Answers
**Status: done.**
- No paper bills issued yet under any series → sequences start at
  invoice 101 / DC 151 (no bootstrap migration needed).
- GST rate confirmed as 9% SGST + 9% CGST.
- No unit column on the physical bill → field dropped.

## Slice 1 — Skeleton + print engine
**Status: done.**
- Vite + React + TypeScript, Tailwind **v3** pinned deliberately
  (`tailwind.config.js` — v4 changes `rounded-sm`/`shadow-sm`/bare
  `border` semantics that the ported layout relies on).
- Logo bundled as a static asset (`src/assets/logo.jpg`, 512×512,
  resized from the higher-resolution artwork the shop provided —
  original kept at `reference/logo-source-hires.jpg`). Replaces the
  prototype's embedded 240×240 JPEG, which is still extractable from
  `reference/billing-system.jsx` if ever needed.
- Fonts self-hosted via `@fontsource/*`, loaded in `main.tsx`; global
  print styles in `src/index.css` (`@page`, break rules) survive print
  because they're never unmounted.
- `PrintShell` + `INVOICE_CONFIG`/`DC_CONFIG` — one engine, two
  documents. See `docs/ARCHITECTURE.md`.
- Three committed fixtures (`src/fixtures/*.json`) + automated
  regression check (`scripts/verify-print.mjs`) — **all passing**:
  zero console errors, zero external network requests during render,
  correct PDF page counts (`invoice-max` spans >1 A4 page,
  `invoice-min`/`dc-max` fit on one).
- Visually verified via Playwright screenshots against
  `npm run preview`: dates render `DD-MM-YYYY`, amount-in-words reads
  "Rupees ... Only" (no duplicate word), round-off row appears and the
  total reconciles exactly, long descriptions wrap without breaking
  row height.
- **Not yet done, and cannot be done remotely:** the actual
  hold-it-next-to-the-paper-bill test on the shop's printer, and the
  father's approval. This requires physical access — see
  `docs/PRINT.md` for the checklist to run when that's possible.
- Not yet deployed to Vercel (needs the user's Vercel account/CLI login).

## Slice 2 — Database that can't produce a wrong bill
**Status: done and verified against the live Supabase project.**

Applied, via a direct Postgres connection, in order: `schema.sql` →
`functions.sql` → `policies.sql`. Both exit-criteria scripts pass
against the real project (not the SQL editor, which bypasses RLS and
would prove nothing):

```
npm run test:rls          → All RLS checks passed.
npm run test:numbering    → All numbering checks passed.
```

**Two real bugs found and fixed during this first live run** — both
the same class of mistake, both in `create_invoice`/`create_dc`:
`returns table (invoice_no int, id uuid, ...)` implicitly declares
`id` as a PL/pgSQL variable in scope for the whole function body, so
a bare `where id = ...` inside the function is genuinely ambiguous
between that variable and a table's `id` column — Postgres rejected
it at runtime with "column reference 'id' is ambiguous." Fixed by
qualifying (`delivery_challans.id`, `settings.id`). This is exactly
why the plan called for testing against a live database instead of
trusting reviewed-but-unexecuted SQL.

**Also fixed:** `scripts/test-numbering.mjs` originally opened 60
concurrent `signInWithPassword` sessions to get 60 distinct clients —
Supabase's auth rate limit rejected that burst (and it triggered a
Node/Windows libuv crash under the connection burst). Changed to sign
in once and share that session's access token across 60 separate
client instances instead; still genuinely concurrent at the HTTP/RPC
level, without hammering the auth endpoint.

**Verified live, beyond the two exit-criteria scripts:**
- `create_dc`, `cancel_invoice`, `cancel_dc` all work correctly.
- An invoice can reference a DC via `dc_id`; `cancel_dc` on a billed
  DC is correctly blocked ("DC 151 is billed on invoice 192. Cancel
  that invoice first."), and succeeds once that invoice is cancelled.
- `cancel_invoice` is idempotent (a second call is a no-op, not an
  error).
- The IGST hard-block fires correctly for an out-of-state customer
  GSTIN, with zero invoice numbers burned by the rejection.
- 60 concurrent `create_invoice` calls (30 valid / 30 deliberately
  invalid) → exactly 30 succeed, the sequence advances by exactly 30,
  zero orphaned headers, zero unexplained gaps in `invoice_register`.

All test data generated during verification was wiped and both
sequences reset to 101/151 (`scripts/reset-test-data.mjs`) — the
project is in the same state as before any test ran, so the shop's
real first invoice will be #101 and first DC will be #151.

**⚠️ Flagging, not blocking:** the one shared login you created uses
a 4-digit numeric password — almost certainly rejected by Supabase's
"leaked password protection" if that's turned on, and easy to guess.
This becomes the *permanent* day-to-day login for a system holding
real customer GSTINs and tax documents. Strongly recommend changing
it (Authentication → Users → the user → reset password) before
Slice 3 puts this in front of a real customer bill — I did not
change it myself since it's your credential to manage.

## Slice 3 — Invoice end to end, and Slice 4 — DC by configuration
**Status: done and verified live, both together.** Building `PrintShell`
and configs generically from Slice 1 onward meant DC needed zero new
form or print components once the invoice form worked — `DocumentForm`
+ `DC_FORM_CONFIG` and `PrintShell` + `DC_CONFIG` (already built in
Slice 1) were the entire DC implementation. Slice 4's structural exit
criterion ("the diff adds no new component, only config") held without
having to enforce it separately.

Also added, since without it nobody could reach any of this: a login
screen (`src/pages/LoginPage.tsx`), session handling
(`src/lib/AuthProvider.tsx`), and route protection
(`src/lib/ProtectedRoute.tsx`) — the original slice breakdown counted
this as part of Slice 2's scope but the UI for it hadn't been built
yet.

**Verified live, end to end, via Playwright against the real
project** (screenshots taken, not just "it compiled"):
- Full flow: log in → new invoice → autocomplete/fill → Save & Print
  → lands on `/print/invoice/101`. Every number, date, and money field
  on the rendered page checked by hand: dates `DD-MM-YYYY`, GST split
  correct, `750 + 67.50 + 67.50 = 885.00`, words "Rupees Eight Hundred
  Eighty Five Only" matching the total exactly.
- Same for a DC: `/print/dc/151`, 4-column table, no tax, correct
  "GST not charged" note, receiver + authorised signatory columns.
- **The duplicate-customer-by-typing bug is confirmed fixed live**,
  not just by code review: created two invoices by typing the exact
  same customer name both times (never touching the autocomplete
  dropdown) — the database has exactly one customer row, and both
  invoices reference it.
- Draft autosave: typed a customer name and a line description,
  waited past the 400ms debounce, reloaded the page — both fields
  were restored from `localStorage`.
- Mobile layout (375px viewport, iPhone SE-sized): line items render
  as stacked cards with 44px-minimum touch targets, not the
  prototype's unusable 7-column table.
- Found and fixed a real bug during this first live run: successful
  login never navigated anywhere — nothing in `LoginPage` reacted to
  the session becoming truthy. Fixed by navigating explicitly on
  success and redirecting away from `/login` if already signed in.

All test data wiped afterward via `scripts/reset-test-data.mjs`; the
project is back to zero rows with sequences at 101/151.

**Deliberately out of scope for this pass** (noted so it's a decision,
not a gap discovered later): the invoice form doesn't yet expose a
"bill against this DC" picker — `dc_id` is wired through the RPC and
the schema, but there's no UI to select an existing delivery challan
when creating an invoice. Also not built yet: History (Slice 5), and
the customer/item/settings editors (Slice 6, deliberately deferred —
the form already learns both on save).

## Slice 5 — History, cancel, hand-off
**Status: done and verified live.**

- `src/pages/HistoryPage.tsx` queries the `documents` view server-side
  — search by customer name or document number, filter by type,
  `order by date desc, doc_no desc`, capped at 100 rows. The prototype
  did all of this in JS over the full in-memory array and sorted on
  the `date` string alone, so same-day documents had no deterministic
  order.
- Cancel with a required typed reason (`cancel_invoice`/`cancel_dc`,
  built in Slice 2). Cancelled documents stay in the list — struck
  through, tagged CANCELLED, still reachable via "View" — never
  hidden, so the operator can't mistake a cancelled number for a gap.
- The `CancelledWatermark` component built in Slice 1 (before there
  was even a cancel feature to use it) is now wired up: a diagonal
  CANCELLED stamp plus a footer line with the date and reason.
- **Verified live**: created an invoice, found it in History by
  searching the customer's name, cancelled it with a reason, confirmed
  it stays visible struck-through, and confirmed the print page shows
  the watermark and reason. **Found and fixed a real bug in this same
  run**: the cancellation footer rendered a garbled string
  ("14T13:25:48.688282+00:00-09-2026") instead of a date —
  `formatDateDDMMYYYY` assumed a plain `YYYY-MM-DD` string but
  `cancelled_at` is a full timestamptz, and a bare `.split("-")` broke
  on the "-" inside the timezone offset. Fixed in `src/lib/money.ts`.
- One-click CSV export of all invoices (`src/lib/export.ts`, a button
  on the History page) — GSTIN, subtotal, tax breakdown, status,
  cancellation reason, one row per invoice. A convenience for the
  accountant at filing time, not a substitute for real backups.
- PWA icons generated from the shop's actual logo artwork
  (`public/icon-192.png`, `public/icon-512.png`) and wired into the
  manifest and `index.html` — "add to home screen" now shows the real
  logo, not a blank icon.
- `docs/HOW-TO-MAKE-A-BILL.md` — the one-page operator instructions,
  written for your father: making an invoice, making a DC, finding an
  old bill, and — the one that matters most — what to do if a mistake
  is made (cancel with a reason, never expect a delete button) and
  what to do if the connection drops mid-bill.

**Still needs a human, not code:** confirming Supabase's scheduled
backups are actually turned on (dashboard-only setting, documented in
`supabase/README.md`), and sitting with your father to walk through
`docs/HOW-TO-MAKE-A-BILL.md` for real.

**Deliberately out of scope:** an invoice-to-DC picker in the form
(same note as Slice 3/4) — `dc_id` is wired through the schema and
RPC, but there is no UI yet to select an existing DC when billing
against it.

## Post-Slice-5 update (2026-09-15) — IGST built for real; autofill/name bug fixed

Two changes prompted by the user, verified live against the real
project.

**IGST, no longer deferred.** The shop confirmed inter-state orders do
happen, reversing the assumption behind the Slice 2/3 hard block (see
`docs/DECISIONS.md` §9 for the full reasoning). `create_invoice` now
computes IGST for an out-of-state customer instead of refusing to
issue the bill:
- `supply_type`/`place_of_supply` are set from the customer's GSTIN
  state code (unchanged detection logic); tax computation branches on
  it instead of raising an exception.
- IGST rate = `settings.gst_split * 2` (standard practice — the
  combined SGST+CGST rate and the IGST rate are the same number).
- The existing `inv_tax_mode` CHECK constraint (built in Slice 2,
  specifically so this reversal wouldn't need a migration) already
  guarantees SGST/CGST and IGST can never both be non-zero on the same
  row — no schema change was needed, only the function.
- `InvoiceTotals.tsx` renders "IGST @X%" in place of the SGST/CGST rows
  when `supplyType === "inter"`.
- The form's out-of-state warning changed from "Saving will be
  blocked" to an informational note; the Save button is no longer
  disabled for an out-of-state GSTIN.
- New permanent fixture `invoice-interstate` added to the print
  regression harness (`scripts/gen-fixtures.mjs`,
  `scripts/verify-print.mjs`) so this render path is checked
  automatically going forward.
- **Verified live**: created a real inter-state invoice via direct RPC
  call and confirmed `supply_type='inter'`, `sgst=cgst=0`,
  `igst_pct=18`, correct total and words; then repeated the same
  through the actual browser form (not just the API) and confirmed the
  Save button stays enabled and the printed invoice renders "IGST
  @18%" correctly.
- Known simplification, not a bug: a customer with no GSTIN on file
  has no determinable state from the data this app captures, so
  defaults to intra-state.

**Autofill / honorific-prefix bug.** The customer name, address, GSTIN,
and item description inputs had no `autoComplete` attribute, leaving
the browser's own per-field autofill free to interfere with — and
occasionally insert saved values like "Mr"/"Mrs" into — the customer
name field. Fixed:
- `autoComplete="off"` plus a unique `name` attribute added to those
  inputs, so the browser's own suggestion dropdown can't compete with
  the app's custom autocomplete.
- `stripHonorificPrefix()` (`src/lib/validation.ts`) strips a leading
  "Mr/Mrs/Ms/Miss/Shri/Smt/Dr" (with or without a trailing period)
  from the customer name — applied live as the operator types, **and**
  again server-side in `find_or_create_customer` (defense in depth,
  same principle used throughout this project: the database enforces
  it regardless of client version or entry path).
- **Verified live**: typed "Mr Test Honorific" into the actual form
  and confirmed the input showed "Test Honorific" before Save was even
  clicked; separately confirmed via direct RPC call that a name typed
  as "Mr Bangalore Traders" is stored as "Bangalore Traders".

## Slice 6 — Master-data + settings editors (optional)
**Status: not started.** Deliberately deferred — see
`docs/DECISIONS.md`.
