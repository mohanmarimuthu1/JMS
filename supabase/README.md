# Supabase setup (Slice 2)

Full reasoning for every choice here is in `docs/DECISIONS.md`. This is
the how.

## 1. Apply the SQL, in order

In the Supabase dashboard's **SQL Editor**, run these three files in
order (each depends on the previous one existing):

1. `supabase/schema.sql` — tables, sequences, indexes, views
2. `supabase/functions.sql` — `create_invoice`, `create_dc`,
   `cancel_invoice`, `cancel_dc`, `numbering_health`, word-conversion
3. `supabase/policies.sql` — RLS policies + grants/revokes

**Do not treat a clean run of these files as "it works."** The SQL
editor executes as a privileged role and bypasses RLS entirely — it
will report success even if every policy is wrong. The actual proof is
`scripts/test-rls.mjs` (below), run through the anon key like the real
app does.

## 2. Dashboard settings that are not SQL

These matter as much as the policies and are easy to forget because
they live in the dashboard, not in a file you can review:

- **Authentication → Providers → Email → "Allow new users to sign
  up": OFF.** Default is ON. Left on, anyone can `POST
  /auth/v1/signup`, receive the `authenticated` role, and read/write
  every invoice.
- **Authentication → Sign In / Providers → Anonymous sign-ins: OFF.**
  A separate toggle from the above, and also grants `authenticated`.
- Disable every other sign-in provider (Google, phone, magic link,
  etc.) — each is an independent path to `authenticated`.
- **Authentication → Users → Add user →** create the one shared login
  by hand, with **Auto Confirm User** checked. Store the password
  somewhere durable (a password manager, or written down and kept at
  the shop) — this is the only login that will ever exist.
- **Authentication → URL Configuration:** set Site URL to the actual
  deployed domain once there is one, and restrict the redirect
  allowlist to it.
- **Authentication → Policies → Password → "Leaked password
  protection": ON.**
- **Project Settings → API:** confirm the `service_role` key is never
  pasted into any file in this repo or added as a `VITE_`-prefixed
  environment variable. Only the `anon` `public` key belongs in
  `.env.local` / Vercel env vars — a `service_role` key in a Vite
  bundle bypasses every policy in `policies.sql`.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in the Project URL and
anon key from **Project Settings → API**. `.env.local` is gitignored —
never commit real credentials.

## 4. Run the exit-criteria tests

```bash
# Reads from .env.local automatically via Node's --env-file:
node --env-file=.env.local scripts/test-rls.mjs
node --env-file=.env.local scripts/test-numbering.mjs
```

`test-rls.mjs`'s anonymous-only checks (signup disabled, anonymous
sign-in disabled, RPCs unreachable, all tables unreadable) run with
just `SUPABASE_URL`/`SUPABASE_ANON_KEY` set. The authenticated checks
(and all of `test-numbering.mjs`) additionally need `TEST_EMAIL`/
`TEST_PASSWORD` for the one shared login created in step 2 — set those
in `.env.local` too, or pass them inline.

Both must exit 0 before Slice 2 is considered done — these are the
plan's actual exit criteria, not a formality.

**Both scripts create and cancel real rows as a side effect** (test
customers, invoices, DCs). Once real shop data exists in this
project, do not run them against it. Until then, clean up after a
test run with:

```bash
SUPABASE_DB_PASSWORD=... npm run db:reset-test-data
```

This wipes all invoices/DCs/customers/items and resets both
sequences back to 101/151 — the shop's actual first invoice and DC
numbers. There's no confirmation prompt; it's a dev tool, not
something the app ever calls.

## 5. Numbering

No paper bills have been issued yet under any series (confirmed with
the shop), so `invoice_no_seq`/`dc_no_seq` start at 101/151 in
`schema.sql` and need no bootstrap/`setval` migration. If that ever
turns out to be wrong, or a backup restore ever desyncs the sequence
from the data, `select * from numbering_health();` (as the
authenticated user) reports it.
