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

## Slice 3 — Invoice end to end
**Status: not started.** Depends on Slice 2.

## Slice 4 — DC by configuration only
**Status: not started.** Depends on Slice 3.

## Slice 5 — History, cancel, hand-off
**Status: not started.** Depends on Slices 3–4.

## Slice 6 — Master-data + settings editors (optional)
**Status: not started.** Deliberately deferred — see
`docs/DECISIONS.md`.
