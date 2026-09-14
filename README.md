# JMS Engineering — Billing

A web app replacing JMS Engineering's paper invoice + delivery challan
(DC) book. Rebuilt on Vite + React + TypeScript + Supabase from an
earlier single-file prototype.

## Start here

- **`docs/DECISIONS.md`** — why this is built the way it is, what was
  changed from the original plan, what was cut, and why.
- **`docs/ARCHITECTURE.md`** — map of the code as it exists.
- **`docs/PRINT.md`** — the print engine: how to test it, and every
  defect fixed relative to the original prototype.
- **`docs/PROGRESS.md`** — what's done, what's blocked, and on what.
- **`reference/`** — the original prototype (`billing-system.jsx`),
  plan, and schema this was rebuilt from. Not imported by the app;
  kept so code comments can cite exact line numbers.

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build         # type-check + production build
npm run preview       # serve the production build locally
```

## Print regression check

```bash
npm run preview &
node scripts/verify-print.mjs
```

Checks all three committed fixtures (`src/fixtures/*.json`) for
console errors, unwanted network requests, and correct page counts.
This is a regression net, not a substitute for the manual golden-sample
test described in `docs/PRINT.md` — printing on the shop's actual
printer and holding it next to a real paper bill.

## Status

See `docs/PROGRESS.md`. Slice 1 (print engine) is done and verified
by the checks above; Slice 2 (Supabase schema, auth, numbering) is
blocked on a Supabase project being provisioned.
