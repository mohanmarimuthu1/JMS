# Architecture

## Why this exists

JMS Engineering replaces a paper invoice + delivery challan (DC) book
with a web app. The full reasoning for every decision below — what was
wrong with the original single-file prototype, what was cut, and why —
lives in [`docs/DECISIONS.md`](DECISIONS.md). This file is the map of
the code as built; that file is the argument for why it's built this
way.

The original prototype is kept for reference at
[`reference/billing-system.jsx`](../reference/billing-system.jsx),
alongside the original plan and schema it was built from. Line numbers
cited throughout this codebase's comments point at that file.

## One document engine, two configs

An invoice and a delivery challan are the same document with different
fields switched on: a DC has no rate/GST columns, an invoice does; a DC
has a purpose selector, an invoice has order/DC reference fields. The
prototype built them as two ~70%-duplicated components (forms *and*
print templates) that had already drifted from each other in small,
almost certainly accidental ways.

This build has exactly one of each:

- **`src/documents/PrintShell.tsx`** — the entire bordered-frame print
  layout: header band, contact/title strip, bill-to block, line-item
  table, footer. Takes a `DocConfig` and a `PrintableDocument`.
- **`DocumentForm`** (Slice 3) — will be the equivalent for data entry.

Per-type differences live entirely in **`src/documents/configs.ts`**
(`INVOICE_CONFIG` / `DC_CONFIG`) as data, not code — column lists,
labels, which footer component to render, how many signature slots.
Adding a third document type, if that were ever needed, would mean
writing a third config object, not a third component tree.

**The proof this held:** when the DC form ships in Slice 4, the diff
should add zero new form/print components — only a config. If it
doesn't, the abstraction failed and needs fixing then, not months
later after both paths have drifted again.

## Print is a route, not a state swap

`/print/invoice/:no`, `/print/dc/:no`, `/print/fixture/:name` are real
routes (`src/router.tsx`), rendered by pages under `src/pages/`. The
prototype replaced the entire mounted app with a print view via a
`printInvoice` state variable — which meant a document had no URL, no
back button, no way to reopen it after a reload, and (the costly part)
it unmounted the component that carried the app's font-loading
`<style>` block, so print silently fell back to the browser default
font.

Routing avoids all of that structurally: the global stylesheet
(`src/index.css`, loaded once in `main.tsx`) is never unmounted, and a
document's URL can be bookmarked, reopened, or handed to a second
device on the shop network.

## Money and text that can't drift apart

Two things the prototype got wrong, fixed structurally rather than by
convention:

1. **Fonts.** `@fontsource/*` packages are bundled at build time
   (`src/main.tsx`) instead of a Google Fonts `@import`. Nothing during
   print depends on a network request resolving in time.
2. **Amount-in-words vs. the printed total.** From Slice 2 onward,
   `amount_in_words` is a column computed once in Postgres from the
   same whole-rupee `total` that's stored — see
   `src/lib/money.ts` for why this file deliberately contains no words
   function, and `docs/DECISIONS.md` §6 for the full rounding design.

## Directory layout

```
src/
  config/business.ts     Fixed business details — the print seed value
                          before any database exists (Slice 1), later
                          also the Settings-editor fallback (Slice 6).
  documents/              The one document engine (see above).
    types.ts              PrintableDocument / DocConfig shapes.
    configs.ts            INVOICE_CONFIG, DC_CONFIG — print-side config.
    formConfigs.ts         INVOICE_FORM_CONFIG, DC_FORM_CONFIG — the
                           form's equivalent (which RPC, whether rate
                           columns show, purpose options).
    DocumentForm.tsx        The one form engine (Slice 3), config-driven
                            same way PrintShell is. Handles customer/
                            item autocomplete, draft autosave, the
                            "Last bill issued" fact (never a promised
                            number), and calling the right RPC.
    PrintShell.tsx         Shared bordered-frame print layout.
    PrintPageChrome.tsx     Shared no-print toolbar (Back/Print) used
                            by both the fixture harness and the real
                            print page.
    InvoiceTotals.tsx      Footer for kind="invoice" (words + GST box).
    DCNote.tsx             Footer for kind="dc" (no-tax note).
    CancelledWatermark.tsx Overlay, wired up in Slice 5.
  fixtures/               Committed print-regression fixtures (JSON).
                           See docs/PRINT.md.
  hooks/useAutocomplete.ts Debounced, server-side, capped customer/item
                           search — see docs/DECISIONS.md.
  lib/
    money.ts              Display-only formatting. No words function
                           — see docs/PRINT.md.
    supabase.ts            The Supabase client. Fails loudly at import
                            if env vars are missing.
    AuthProvider.tsx        Session context — one shared login, no
                            roles, on purpose.
    ProtectedRoute.tsx      Redirects to /login if there's no session.
    draft.ts                localStorage autosave helpers.
    validation.ts           GSTIN format + Tamil Nadu state-code check
                            (client-side mirror of the DB's hard block).
  pages/                  Route-level components (LoginPage, HomePage,
                          NewInvoicePage, NewDCPage, PrintFixturePage,
                          PrintDocumentPage).
  router.tsx              All app routes.
scripts/
  gen-fixtures.mjs        Regenerates src/fixtures/*.json. Not shipped.
  verify-print.mjs        Automated print regression check (console
                           errors, network isolation, page count).
  test-rls.mjs            RLS/auth checks through the anon key.
  test-numbering.mjs      Concurrency + partial-write checks.
  apply-schema.mjs        Applies supabase/*.sql via a direct DB
                           connection. Ops tool, not shipped.
  reset-test-data.mjs     Wipes business data, resets sequences to
                          101/151. Ops tool, not shipped.
supabase/                 Schema, RPCs, RLS policies. See supabase/README.md.
reference/                The original prototype, plan, and schema —
                           kept for citation, not imported by the app.
```
