# Process — status, what's left, how this is being built

One-page status check. For the reasoning behind decisions, see
`docs/DECISIONS.md`; for the code map, `docs/ARCHITECTURE.md`; for
print-specific detail, `docs/PRINT.md`. This file is the "where are we
right now" summary — I'll keep it current as work lands.

---

## What's done

### Slice 1 — Print engine ✅ verified, on `main`
The app that turns an invoice/DC into a printed page. One shared
`PrintShell` component drives both document types via config (not two
duplicated print templates, like the original prototype had).

- Vite + React + TypeScript scaffold. Tailwind v3, ESLint flat config,
  0 npm audit vulnerabilities (Vite pinned to the stable 7.x line —
  see "A correction" below).
- Fonts and logo bundled as static assets — nothing print depends on
  fetches over the network.
- Real `@page`/page-break CSS so multi-page invoices don't break their
  own frame.
- Fixed 4 known defects from the prototype: raw ISO dates, a
  duplicated "Rupees" in the amount-in-words, a words/total rounding
  mismatch, and the wrong font during print.
- Three committed print fixtures + an automated regression script
  (`scripts/verify-print.mjs`) checking console errors, network
  isolation, and correct page counts — all passing.
- Verified by building, linting, and visually inspecting rendered
  output via headless-browser screenshots.

**Not verified (needs you, not code):** printing on the shop's actual
printer, held next to a real paper bill. That's a physical step —
checklist is in `docs/PRINT.md`.

### Slice 2 — Database layer ✅ verified, against your real Supabase project
Full schema, atomic invoice-numbering functions, and row-level
security policies — applied and tested against the live database,
not just reviewed on paper.

- `npm run test:rls` and `npm run test:numbering` both pass against
  the real project.
- Found and fixed two genuine bugs live: a PL/pgSQL variable-shadowing
  bug in `create_invoice`/`create_dc` ("column reference 'id' is
  ambiguous" — a function's own output-column name collided with a
  table's `id` column), and a test-script design flaw (60 concurrent
  logins hit Supabase's auth rate limit and crashed Node on Windows —
  fixed by signing in once and sharing that session across clients).
- Beyond the two required scripts, manually verified live: `create_dc`,
  `cancel_invoice`, `cancel_dc`, the invoice↔DC link, the "can't cancel
  a billed DC" guard, idempotent cancellation, and the IGST hard-block
  for out-of-state customers (confirmed it burns zero invoice numbers).
- 60 concurrent invoice creations (half deliberately invalid): exactly
  the valid half succeeded, the sequence advanced by exactly that many,
  zero orphaned records, zero unexplained gaps.
- Test data wiped afterward; sequences reset to 101/151 so your
  father's actual first invoice and DC will be numbered exactly there.

**Flagging for you:** the shared login's password is a weak 4-digit
number — for what's now the permanent daily login on a system holding
real customer tax data. Change it (Authentication → Users → reset
password) before Slice 3 puts this in front of a real customer.

---

## What's left

| Slice | What it covers | Status |
|---|---|---|
| 3 | Invoice form end to end, on a phone | Not started |
| 4 | Delivery challan (by config, not new code) | Not started |
| 5 | History list, cancel/void, backups | Not started |
| 6 | Customer/item/settings editors *(optional)* | Not started, deliberately deferred |

Full detail and exit criteria for each in `docs/PROGRESS.md`.

---

## Right now

Slice 2 is done and merged. Starting Slice 3 (the invoice form) next.

---

## A correction, while I was at it

Fixing an `npm audit` finding, I initially jumped the build tool
(Vite) straight to its newest major version (8.x) to clear a security
advisory. That turned out to require a different, newer plugin
architecture (oxc/rolldown-based) than this project needs, and it
only "installed" because `npm audit fix --force` silently overrode a
real peer-dependency conflict — a plain `npm install` afterward caught
it properly. Re-pinned to Vite's stable 7.x line instead, which
already fixes the same security advisory and has no conflicts. Full
build + lint + print-regression suite re-verified clean afterward.
Noting this here because "install the newest version" is not the same
goal as "install a version that's actually stable and mutually
compatible," and the latter is what "super functional and errorless"
requires.

---

## Methods — how this is being built

1. **Print first, database second.** The plan this is built from
   (`docs/DECISIONS.md`) reordered the original 9-phase plan so the
   highest-uncertainty, most product-defining work — does the printed
   page actually match the paper bill book — comes before any backend
   code, not after 80% of the effort.
2. **One engine per concern, not one per document type.** Invoice and
   DC share a print shell and (from Slice 3) will share a form engine,
   driven by config. The original prototype built these twice and they
   had already drifted apart in small, likely-accidental ways.
3. **Exit criteria are scripts that can fail, not steps that always
   pass.** E.g. Slice 2's numbering test fires dozens of concurrent,
   partially-invalid requests and checks the sequence advanced by
   exactly the valid count — not "open two browser tabs," which a
   Postgres sequence passes unconditionally and therefore proves
   nothing.
4. **Nothing is called "done" without running it.** Build, lint, the
   automated print/RLS/numbering checks, and — where physically
   possible — an actual screenshot or printed page, before anything is
   reported as complete.
5. **Every non-obvious decision is written down**, in
   `docs/DECISIONS.md`, with the reasoning — including what was cut
   and why, and what was deferred on purpose rather than forgotten.
6. **Small, reviewable commits under your name**, pushed to GitHub as
   each verified unit of work completes; unverified/draft work stays
   on a branch until it's actually tested, not merged to `main` on
   faith.
