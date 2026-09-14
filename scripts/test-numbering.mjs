// Slice 2 exit criterion #2 (docs/DECISIONS.md #4f). Replaces the original
// plan's "open two browser tabs" test, which a Postgres sequence passes
// unconditionally and therefore proves nothing (sequences are
// non-transactional specifically so they can't collide). This targets the
// risks that are actually real: a partial write (header inserted, lines
// insert fails) and numbers burned by validation failures.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... TEST_EMAIL=... TEST_PASSWORD=... \
//     node scripts/test-numbering.mjs
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
const N = 60;

if (!URL || !ANON || !TEST_EMAIL || !TEST_PASSWORD) {
  console.error("Set SUPABASE_URL, SUPABASE_ANON_KEY, TEST_EMAIL, TEST_PASSWORD.");
  process.exit(1);
}

let failures = 0;
const assert = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failures++;
};

const validPayload = (i) => ({
  payload: {
    date: "2026-09-14",
    customer: { name: `Concurrency Party ${i % 5}`, address: "Coimbatore", gstin: null },
    order_no: `CT-${i}`,
    lines: Array.from({ length: 3 }, (_, k) => ({
      description: `part-${i}-${k}`, hsn: "7326", qty: "3", rate: "133.33",
    })),
  },
});
const invalidPayload = (i) => ({
  payload: { date: "2026-09-14", customer: { name: `Concurrency Party ${i % 5}` }, lines: [] },
});

async function main() {
  // Sign in ONCE — Supabase's auth rate limit (and, on Windows, a
  // libuv assertion crash under a burst of concurrent TLS handshakes)
  // makes firing 60 concurrent signInWithPassword calls the wrong way
  // to get concurrency. Reused across N distinct client instances,
  // each carrying the same access token via a header instead of its
  // own session, so requests still genuinely overlap on separate
  // connections — a single shared client would pipeline on one
  // connection and serialize, which is exactly why a two-tab test
  // proves nothing.
  const authClient = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: session, error: loginErr } = await authClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (loginErr) throw loginErr;
  const token = session.session.access_token;

  const clients = Array.from({ length: N }, () =>
    createClient(URL, ANON, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }),
  );
  const probe = clients[0];

  // ---------------- Round 1: all valid, fired simultaneously ----------------
  const r1 = await Promise.all(clients.map((c, i) => c.rpc("create_invoice", validPayload(i))));
  const ok1 = r1.filter((r) => !r.error).map((r) => r.data[0]);
  assert(ok1.length === N, `all ${N} concurrent creates succeeded (got ${ok1.length})`);

  const nums = ok1.map((r) => r.invoice_no);
  assert(new Set(nums).size === nums.length, "every returned invoice number is distinct");

  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  assert(
    hi - lo + 1 === nums.length,
    `numbers ${lo}..${hi} are contiguous — nothing was burned on a success path`,
  );

  for (const r of ok1) {
    const { count } = await probe
      .from("invoice_lines")
      .select("*", { count: "exact", head: true })
      .eq("invoice_no", r.invoice_no);
    if (count !== 3) {
      assert(false, `invoice ${r.invoice_no} has ${count} lines, expected 3 (partial write)`);
      break;
    }
  }
  assert(true, "every invoice has its full line set (header + lines were atomic)");

  {
    const { data } = await probe
      .from("invoices")
      .select("invoice_no,subtotal,sgst,cgst,round_off,total,amount_in_words")
      .in("invoice_no", nums);
    const bad = data.filter(
      (v) =>
        Number(v.total) !== Number(v.subtotal) + Number(v.sgst) + Number(v.cgst) + Number(v.round_off) ||
        Number(v.total) !== Math.round(Number(v.total)) ||
        !v.amount_in_words,
    );
    assert(bad.length === 0, `all ${data.length} totals are whole-rupee, self-consistent, and worded`);
  }

  // ---------------- Round 2: half the traffic is deliberately invalid ----------------
  const { data: beforeRow } = await probe.from("invoices").select("invoice_no").order("invoice_no", { ascending: false }).limit(1);
  const before = beforeRow[0].invoice_no;

  const r2 = await Promise.all(
    clients.map((c, i) => (i % 2 === 0 ? c.rpc("create_invoice", validPayload(100 + i)) : c.rpc("create_invoice", invalidPayload(i)))),
  );
  const good2 = r2.filter((r) => !r.error);
  const bad2 = r2.filter((r) => r.error);
  assert(good2.length === N / 2 && bad2.length === N / 2, `${good2.length} valid / ${bad2.length} rejected, as designed`);

  const { data: afterRow } = await probe.from("invoices").select("invoice_no").order("invoice_no", { ascending: false }).limit(1);
  const after = afterRow[0].invoice_no;
  assert(after - before === N / 2, `sequence advanced by exactly ${N / 2} — rejections burned no numbers (advanced by ${after - before})`);

  const { data: health } = await probe.rpc("numbering_health");
  const orphans = (health ?? []).filter((h) => h.problem === "ORPHAN_INVOICE_HEADER");
  assert(orphans.length === 0, `no orphan invoice headers (found ${orphans.length})`);

  const { data: register } = await probe.from("invoice_register").select("*").gte("invoice_no", lo);
  const unexplained = register.filter((r) => r.status === "NOT ISSUED");
  console.log(`    register: ${register.length} numbers in range, ${unexplained.length} NOT ISSUED`);
  assert(unexplained.length === 0, "every number in range is accounted for — no unexplained gap");

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll numbering checks passed.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
