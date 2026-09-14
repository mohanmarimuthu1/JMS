// Applies supabase/schema.sql, functions.sql, policies.sql, in order, via
// a direct Postgres connection. This is an ops tool run once (and again
// only if the SQL files change) — not something the shipped app ever
// calls. The DB password is read from an env var only; it is never
// written to any file in this repo. See supabase/README.md.
//
// Usage:
//   SUPABASE_DB_PASSWORD=... node scripts/apply-schema.mjs
// or with an explicit full connection string:
//   DATABASE_URL=postgresql://... node scripts/apply-schema.mjs
import { readFileSync } from "node:fs";
import { Client } from "pg";

const PROJECT_REF = "tmfeknadetbayxtyvyhg";

// Pass specific files as CLI args to re-apply just those (useful since
// schema.sql uses plain `create table`, not `create table if not
// exists` — re-running it after tables exist fails on purpose, so it's
// not "idempotent" the way functions.sql's `create or replace` is).
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["supabase/schema.sql", "supabase/functions.sql", "supabase/policies.sql"];

const connectionString =
  process.env.DATABASE_URL ??
  (process.env.SUPABASE_DB_PASSWORD
    ? `postgresql://postgres:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`
    : null);

if (!connectionString) {
  console.error("Set SUPABASE_DB_PASSWORD (or DATABASE_URL) as an environment variable.");
  process.exit(1);
}

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();
  console.log(`Connected to db.${PROJECT_REF}.supabase.co`);

  for (const file of files) {
    const sql = readFileSync(file, "utf8");
    console.log(`\n--- Applying ${file} ---`);
    try {
      await client.query(sql);
      console.log(`OK: ${file}`);
    } catch (err) {
      console.error(`FAILED: ${file}`);
      console.error(err.message);
      if (err.position) {
        const pos = Number(err.position);
        console.error("Near:", sql.slice(Math.max(0, pos - 80), pos + 80));
      }
      await client.end();
      process.exit(1);
    }
  }

  console.log("\nAll SQL files applied successfully.");
  await client.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
