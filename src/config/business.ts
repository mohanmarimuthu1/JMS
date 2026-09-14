/**
 * Fixed business details for print and the Settings seed row.
 *
 * This constant is what the print engine reads in Slice 1, before any
 * database exists. From Slice 2 onward, every ISSUED document instead
 * carries its own frozen `seller_snapshot` (see supabase/schema.sql) —
 * this constant becomes only the *seed value* for the `settings` table
 * and the fallback used by the live Settings editor (Slice 6). It is
 * deliberately never read directly by anything that prints an already-
 * issued document, so that editing it can never rewrite history.
 *
 * See docs/DECISIONS.md #8 (company-details snapshotting).
 */
export interface BusinessDetails {
  name: string;
  addressLine: string;
  cell: string;
  gstin: string;
  stateCode: string; // GSTIN prefix; "33" = Tamil Nadu
  gstSplitPct: number; // SGST %, mirrored for CGST (intra-state default)
  jurisdiction: string;
}

export const BUSINESS: BusinessDetails = {
  name: "JMS ENGINEERING",
  addressLine:
    "1/2, 39-B-16, Aringar Anna Colony, SIDCO Industrial Estate, Coimbatore - 641 021.",
  cell: "8610026754, 7708881444",
  gstin: "33BBJPJ1166M1ZJ",
  stateCode: "33",
  gstSplitPct: 9,
  jurisdiction: "Coimbatore",
};
