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

export function formatDateDDMMYYYY(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}
