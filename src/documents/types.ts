import type { BusinessDetails } from "@/config/business";

/** A single printable line item. `rate`/`amount` are absent on a DC. */
export interface PrintableLine {
  description: string;
  hsn?: string | null;
  unit?: string | null;
  qty: number;
  rate?: number | null;
  amount?: number | null;
}

export interface PrintableParty {
  name: string;
  address?: string | null;
  gstin?: string | null;
}

/**
 * Shape the print engine renders. Slice 1 fills this from committed JSON
 * fixtures (no database yet). From Slice 2 onward it is populated from
 * `invoices`/`delivery_challans` rows — `seller` comes from the row's
 * frozen `seller_snapshot`, never live `settings`, so an already-issued
 * document can never change because someone edited the business profile
 * later (see docs/DECISIONS.md #8).
 */
export interface PrintableDocument {
  kind: "invoice" | "dc";
  docNo: number | string;
  date: string; // ISO yyyy-mm-dd
  customer: PrintableParty;
  seller: BusinessDetails;
  lines: PrintableLine[];

  // invoice-only
  orderNo?: string | null;
  orderDate?: string | null;
  dcNoManual?: string | null;
  dcDateManual?: string | null;
  subtotal?: number;
  sgstPct?: number;
  sgst?: number;
  cgstPct?: number;
  cgst?: number;
  /** Inter-state supply only — mutually exclusive with sgst/cgst (see
   * the inv_tax_mode CHECK constraint in supabase/schema.sql). */
  igstPct?: number;
  igst?: number;
  supplyType?: "intra" | "inter";
  roundOff?: number;
  total?: number;
  /** Stored, not computed client-side. See src/lib/money.ts. */
  amountInWords?: string;

  // dc-only
  refNo?: string | null;
  purpose?: string | null;
  purposeNote?: string | null;

  status: "issued" | "cancelled";
  cancelledAt?: string | null;
  cancelledReason?: string | null;
}

export interface LineColumnSpec {
  header: string;
  width: string; // css width, e.g. "10mm" or "auto"
  align: "left" | "center" | "right";
  render: (line: PrintableLine | null, index: number) => string;
}

export interface HeaderFieldSpec {
  label: string;
  render: (doc: PrintableDocument) => string;
}

/**
 * One config drives both the form (Slice 3/4) and the print shell
 * (this slice) for a document type. DC is added in Slice 4 purely by
 * writing a second config — see docs/ARCHITECTURE.md.
 */
export interface DocConfig {
  kind: "invoice" | "dc";
  title: string; // "TAX INVOICE" | "DELIVERY CHALLAN"
  numberLabel: string; // "No." | "DC No."
  /** Canonical width for the title strip's 3rd column and the meta row's
   * 2nd column. The prototype drifted (150px invoice / 170px DC, w-16/w-14
   * seal) — this plan picks one value for both types on purpose. */
  metaColWidth: string;
  referenceFields: HeaderFieldSpec[];
  lineColumns: LineColumnSpec[];
  minRows: number;
  footer: "totals" | "note";
  signatureSlots: Array<"receiver" | "authorised">;
  /** Invoice renders party GSTIN as its own dotted-fill row; DC folds it
   * into the "To" block instead. */
  showPartyGstinRow: boolean;
}
