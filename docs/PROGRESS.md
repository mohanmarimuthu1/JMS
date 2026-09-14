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
**Status: not started. Blocked on Supabase project credentials.**
Needs a Supabase project URL + anon key (and, for the numbering
bootstrap step, project owner access) before `supabase/schema.sql`,
the `create_invoice`/`create_dc` RPCs, RLS policies, and
`scripts/test-rls.mjs` / `scripts/test-numbering.mjs` can be written
*and actually run* against a real instance — these are exit criteria,
not aspirational, so they need something real to run against.

## Slice 3 — Invoice end to end
**Status: not started.** Depends on Slice 2.

## Slice 4 — DC by configuration only
**Status: not started.** Depends on Slice 3.

## Slice 5 — History, cancel, hand-off
**Status: not started.** Depends on Slices 3–4.

## Slice 6 — Master-data + settings editors (optional)
**Status: not started.** Deliberately deferred — see
`docs/DECISIONS.md`.
