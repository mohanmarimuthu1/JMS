/**
 * Display-only money formatting for the client.
 *
 * IMPORTANT: this file does NOT contain an amount-in-words function.
 * The prototype's `numToWords` (billing-system.jsx:35-62) rounded to
 * the nearest rupee while the printed figure showed 2 decimals, so the
 * words and the number could legitimately disagree on the same page.
 * From Slice 2 onward, `amount_in_words` is computed once in Postgres
 * from the same whole-rupee `total` that is stored and printed, and is
 * saved as a column — never recomputed client-side. See
 * docs/DECISIONS.md #6 (rounding) and supabase/schema.sql
 * (`num_to_words_inr`).
 */
export function money(n: number | string | null | undefined): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (num === null || num === undefined || Number.isNaN(num)) return "0.00";
  return num.toFixed(2);
}

/** Accepts either a plain date ("2026-09-14") or a full timestamptz
 * ("2026-09-14T13:25:48.68+00:00") — only the date portion is ever
 * rendered. A bare `.split("-")` on a full timestamp breaks on the
 * timezone offset's own "-", which is how this shipped its first bug
 * (docs/PROGRESS.md): a cancelled-invoice footer rendering
 * "14T13:25:48.688282+00:00-09-2026" instead of a date. */
export function formatDateDDMMYYYY(iso: string | null | undefined): string {
  if (!iso) return "—";
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d || y.length !== 4) return iso;
  return `${d}-${m}-${y}`;
}
