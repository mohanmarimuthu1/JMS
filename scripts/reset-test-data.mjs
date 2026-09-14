// Wipes all business data and resets both sequences to their designed
// start values (101 / 151). Intended for use between test runs during
// development — running scripts/test-rls.mjs and scripts/test-numbering.mjs
// against a real project creates and cancels real rows as a side effect.
//
// NEVER run this against a project holding real shop data — it deletes
// every invoice, DC, customer, and item, unconditionally. There is no
// confirmation prompt on purpose: this is a dev tool, not something
// wired into the app.
//
// Usage: SUPABASE_DB_PASSWORD=... node scripts/reset-test-data.mjs
import { Client } from "pg";

const PROJECT_REF = "tmfeknadetbayxtyvyhg";
const connectionString =
  process.env.DATABASE_URL ??
  (process.env.SUPABASE_DB_PASSWORD
    ? `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`
    : null);

if (!connectionString) {
  console.error("Set SUPABASE_DB_PASSWORD (or DATABASE_URL).");
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  await client.query("begin");
  await client.query("delete from invoices"); // invoice_lines cascade
  await client.query("delete from delivery_challans"); // dc_lines cascade
  await client.query("delete from customers");
  await client.query("delete from items");
  await client.query("alter sequence invoice_no_seq restart with 101");
  await client.query("alter sequence dc_no_seq restart with 151");
  await client.query("commit");

  const { rows } = await client.query(
    "select (select last_value from invoice_no_seq) as next_invoice, (select last_value from dc_no_seq) as next_dc",
  );
  console.log(`Wiped. Next invoice will be #${rows[0].next_invoice}, next DC will be #${rows[0].next_dc}.`);
  await client.end();
}

main().catch(async (err) => {
  console.error("Fatal:", err.message);
  await client.end();
  process.exit(1);
});
