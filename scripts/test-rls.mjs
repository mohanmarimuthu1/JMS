// Slice 2 exit criterion #1 (docs/DECISIONS.md #4a/#4b). Runs through the
// anon key via @supabase/supabase-js — deliberately NOT the SQL editor,
// which executes as a privileged role and bypasses RLS entirely. A test
// that runs through the SQL editor would pass against a database that
// denies every request the real app ever makes; that's the exact trap
// this test exists to avoid.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... TEST_EMAIL=... TEST_PASSWORD=... \
//     node scripts/test-rls.mjs
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!URL || !ANON) {
  console.error("Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  process.exit(1);
}

const TABLES = [
  "settings", "customers", "items", "invoices", "invoice_lines",
  "delivery_challans", "dc_lines", "documents", "invoice_register",
];

let failures = 0;
const assert = (ok, msg, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}${detail ? `  — ${detail}` : ""}`);
  if (!ok) failures++;
};

async function main() {
  // ---------- 1. logged OUT: everything must be invisible ----------
  const out = createClient(URL, ANON);
  for (const t of TABLES) {
    const { data, error } = await out.from(t).select("*").limit(1);
    assert(
      !!error || (data ?? []).length === 0,
      `anon cannot read ${t}`,
      error ? error.code : `returned ${data?.length} rows`,
    );
  }

  // ---------- 2. the two checks that defend every policy in this repo ----------
  {
    const { data, error } = await out.auth.signUp({
      email: `intruder+${Date.now()}@example.com`,
      password: "Str0ng-Passw0rd!x",
    });
    assert(
      !!error && !data?.user,
      "public signup is DISABLED (Authentication > Providers > Email)",
      error ? error.message : "a user was created — signup is still ON",
    );
  }
  {
    const { data, error } = await out.auth.signInAnonymously();
    assert(
      !!error && !data?.session,
      "anonymous sign-in is DISABLED",
      error ? error.message : "got an authenticated session with no credentials",
    );
  }

  // ---------- 3. RPCs must not be callable by anon ----------
  for (const fn of ["create_invoice", "create_dc", "cancel_invoice", "numbering_health"]) {
    const { error } = await out.rpc(fn, {});
    assert(!!error, `anon cannot call ${fn}()`, error?.message);
  }

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.log("\nSkipping authenticated checks — set TEST_EMAIL/TEST_PASSWORD to run them.");
    finish();
    return;
  }

  // ---------- 4. logged IN: reads work, writes to tax docs do not ----------
  const inn = createClient(URL, ANON);
  const { error: loginErr } = await inn.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
  assert(!loginErr, "shared login works", loginErr?.message);

  for (const t of TABLES) {
    const { error } = await inn.from(t).select("*").limit(1);
    assert(!error, `authenticated can read ${t}`, error?.message);
  }

  const { data: made, error: mkErr } = await inn.rpc("create_invoice", {
    payload: {
      date: new Date().toISOString().slice(0, 10),
      customer: { name: "RLS Test Party", address: "Coimbatore", gstin: null },
      lines: [{ description: "RLS probe", hsn: "", qty: "2", rate: "100" }],
    },
  });
  assert(!mkErr, "authenticated can create an invoice via RPC", mkErr?.message);
  const no = made?.[0]?.invoice_no;

  if (no) {
    {
      const { data, error } = await inn.from("invoices").update({ total: 1 }).eq("invoice_no", no).select();
      assert(!!error || (data ?? []).length === 0, "cannot UPDATE an issued invoice", error?.message ?? `updated ${data?.length} rows`);
    }
    {
      const { data, error } = await inn.from("invoices").delete().eq("invoice_no", no).select();
      assert(!!error || (data ?? []).length === 0, "cannot DELETE an issued invoice", error?.message ?? `deleted ${data?.length} rows`);
    }
    {
      const { error } = await inn.from("invoice_lines").insert({ invoice_no: no, description: "smuggled", qty: 1, rate: 1, line_order: 99 });
      assert(!!error, "cannot append a line to an issued invoice", error?.message);
    }
  }

  {
    const { error } = await inn.from("invoices").insert({
      date: "2026-01-01", customer_snapshot: {}, seller_snapshot: {},
      subtotal: 0, total: 0, amount_in_words: "x",
    });
    assert(!!error, "cannot INSERT an invoice directly — RPC only", error?.message);
  }

  finish();
}

function finish() {
  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll RLS checks passed.");
}

main();
