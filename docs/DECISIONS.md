# Decisions

This is the plan that was approved for this rebuild, kept verbatim as
the design record. It explains *why* the code is organized the way
`docs/ARCHITECTURE.md` describes, what was deliberately cut, and what
was deferred on purpose rather than forgotten. Section numbers referenced
in code comments (`§5(a)`, `§6`, etc.) point here.

A living copy of task status is tracked in `docs/PROGRESS.md` as slices
complete; this file is the reasoning, not the checklist.

---

## Context

`billing-system.jsx` (now `reference/billing-system.jsx`) was a working
single-file React prototype of a billing app for JMS Engineering, a
family lathe/precision-engineering shop in Coimbatore, replacing a
paper invoice + delivery-challan book. The original plan
(`reference/original-plan.md`) rebuilt it on Supabase across 9
hard-gated phases, in dependency order: setup → auth → masters →
invoice → DC → history → print → settings → reliability.

That plan was sound in intent. Its problem was ordering: it was
sequenced for architectural tidiness when it should have been
sequenced to retire uncertainty. The riskiest, most product-defining
work — does the printed page match the bill book, on the shop's own
printer — sat at Phase 6 of 9, reachable only after ~80% of the
effort. It also contained six correctness problems, misidentified its
own biggest risk, and included one feature (moving the logo to
Supabase Storage) whose risk/value trade was clearly bad.

## What changed, and why

### 1. Print moved first, not sixth

This app exists to emit a sheet of paper that looks like the book it
replaces. The prototype's print layout worked by accident — no `@page`
rule, no page-break control, and fonts that silently failed during
print because the `<style>` carrying them was unmounted. If any of
this forced a different approach entirely (say, browser print
couldn't hold the layout and a real PDF renderer was needed), that
needed to surface in hour 4, not after auth, both forms, and history
were already built on top of the assumption. See `docs/PRINT.md`.

### 2. Settings stopped being print's dependency

The original plan had Phase 6 (print) reading from Phase 7 (settings)
— an inverted dependency, since print is the consumer. Fixed by having
print read a typed `src/config/business.ts` constant first (Slice 1),
then a frozen per-document snapshot once the database exists (Slice
2). The settings *editor* becomes optional, late work (Slice 6).

### 3. One document engine, not two parallel builds

The original plan explicitly allowed the invoice and DC phases to run
in parallel, calling out "no shared dependency between them" — which
guarantees the prototype's ~70% form/print duplication gets rebuilt,
and the small drifts already visible in the prototype (title column
150px vs 170px, seal 64px vs 56px) get inherited rather than fixed.
Built once instead: `src/documents/PrintShell.tsx` +
`src/documents/configs.ts`. See `docs/ARCHITECTURE.md`.

### 4. Six correctness problems in the original schema

*(Fixed in Slice 2 — see `supabase/schema.sql` once that lands, and
`docs/PROGRESS.md` for status.)*

- **(a)** RLS was enabled on every table with **zero** `create policy`
  statements — meaning enabled RLS denied every request, and the
  original plan's own verification step ran through the SQL editor,
  which bypasses RLS entirely and would have passed regardless.
- **(b)** Supabase's defaults (email signup on, anonymous sign-in on,
  broad default grants) undermine a "single shared login" design
  unless explicitly turned off in the dashboard — none of which is SQL,
  which is exactly why it's easy to miss.
- **(c)** The invoice/DC number sequences existed but were never wired
  as a column `DEFAULT`, so the client would have called `nextval` in
  a separate round trip — burning a number on every abandoned form.
- **(d)** Header and line-item inserts were two separate client calls,
  so a dropped connection between them could leave an orphaned header
  with a consumed number and no lines.
- **(e)** Both sequences started one number below the prototype's
  actual first invoice/DC (an off-by-one), with no migration step to
  correct it.
- **(f)** The plan's stated "biggest risk" — two browser tabs racing a
  Postgres sequence — cannot actually happen; sequences are
  non-transactional specifically so they can't collide. That test is
  guaranteed to pass and proves nothing. The real risks are partial
  writes (d) and unexplained gaps (c, e).

### 5. Decisions made explicitly rather than left implicit

| Question | Decision | Consequence |
|---|---|---|
| Existing paper numbering | No bills issued yet under any series | Sequences start at invoice 101 / DC 151 — matches the prototype's original defaults, no migration needed |
| Print target | Match the physical paper bill, fixing the prototype's known defects | See `docs/PRINT.md` "Defects fixed" table |
| Void model | Cancel, never hard-delete — both invoices *and* DCs | `invoice_no`/`dc_no` are unique; a hard-deleted number can never be reissued and leaves an unexplained gap in a legal series. Extending this to DCs (not a tax document) is an economic choice, not a legal one: one cancel mechanism is less code than two, and an invoice can reference a DC, so deleting a DC would orphan that link. |
| Offline behavior | Never lose typed work | `localStorage` draft autosave + restore + retry (Slice 3), not a full offline sync queue (see Cuts, below) |
| Paper stock | Blank A4 | The prototype's full header band (logo, name, address) prints on every page; no letterhead-suppression mode needed |
| IGST / place of supply | Deferred | Nullable schema hooks now so it's additive later with no migration, plus a hard save-time block on out-of-state customer GSTINs so the gap fails loud, not silent |
| Backups | Verify Supabase's scheduled backups are on, add a one-click CSV export | Slice 5 |
| Unit column (Nos/Kgs/Hrs) | No unit column on the physical paper bill | Field dropped entirely rather than carried as dead weight (the prototype had `items.unit` with no UI input and no column on either line table — it could never reach a printed line) |

### 6. Rounding and the amount-in-words

The prototype's `numToWords` rounded to the nearest whole rupee while
the printed total showed two decimals (`money()`, `.toFixed(2)`) — so
for values like `1234.495`, the figure prints `1234.50` and the words
say "One Thousand Two Hundred Thirty Four", visibly disagreeing on the
same page. Fixed (Slice 2) by making the stored `total` a whole rupee
by database constraint, with an explicit `round_off` line shown only
when non-zero, and generating `amount_in_words` once from that same
stored total — never recomputed at print time. See `src/lib/money.ts`
for why no words function exists client-side.

### 7. Cuts

- **Logo → Supabase Storage.** The prototype's logo is a synchronous,
  always-renders-correctly base64 data URI (~21KB source, a 240×240
  JPEG). The original plan's Phase 6/7 proposed moving it to Storage —
  turning it into an async network image that must resolve before
  `window.print()` fires immediately on click. The likely failure mode
  is a blank square where the company seal should be, to save ~15KB on
  a page load that happens once a day on the same two devices. Kept as
  a bundled static asset (`src/assets/logo.jpg`) instead — see
  `docs/PRINT.md` defect #7.
- **Logo upload UI.** The logo changes about once a decade; changing
  it is a two-minute redeploy, not a feature.
- **Service worker / full offline sync.** You cannot assign a legal,
  gapless invoice number while offline without risking a duplicate —
  so "survives spotty internet" is honestly met by never losing typed
  work (autosave + retry), not by a sync engine that could double-issue
  a number. A PWA manifest for "add to home screen" is kept; the
  service worker is not.
- **Two-tab concurrency test as the numbering safety gate.** Replaced
  with a script that fires dozens of concurrent, partially-invalid
  requests and checks the sequence advanced by exactly the valid count
  — the two-tab version cannot fail and therefore proved nothing.

### 8. Company-details snapshotting

The prototype froze the customer's details onto each invoice but read
the *seller's* details (name, address, GSTIN) live from settings at
print time — so editing settings retroactively changes the appearance
of every previously issued invoice, including its GSTIN. Fixed by
snapshotting seller details onto the row at creation time (Slice 2),
symmetric with how the customer is already frozen.

---

## Slice structure

The original 9 phases became slices, reordered to retire the print
risk first and merge the invoice/DC duplication:

0. Answers (paper numbering, GST rate, unit column) — done, recorded
   above.
1. Skeleton + print engine — **done**, see `docs/PRINT.md`.
2. Database that can't produce a wrong bill (schema, RLS, numbering
   RPCs, audit view).
3. Invoice end to end (form, autocomplete, validation, mobile layout).
4. DC by configuration only.
5. History, cancel, hand-off basics.
6. Master-data + settings editors (optional, built on demand).

Status of each is tracked in `docs/PROGRESS.md`.
