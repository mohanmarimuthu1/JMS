/**
 * Form-side config, paired with (but distinct from) the print-side
 * `DocConfig` in configs.ts — print needs render/display specs, the
 * form needs input shapes and the RPC to call. Same principle as the
 * rest of the document engine: invoice and DC differ by config, not
 * by a second copy of the form component. See docs/ARCHITECTURE.md.
 */
export interface FormConfig {
  kind: "invoice" | "dc";
  title: string;
  rpc: "create_invoice" | "create_dc";
  numberTable: "invoices" | "delivery_challans";
  numberColumn: "invoice_no" | "dc_no";
  /** Invoice has rate/amount + GST; DC does not (billing-system.jsx:1046 —
   * "GST not charged on this document"). */
  hasRate: boolean;
  purposeOptions?: readonly string[];
  draftStorageKey: string;
  maxLines: number;
}

// Matches the CHECK constraint in supabase/schema.sql exactly — the UI
// offering an option the database would reject is worse than not
// offering it.
export const DC_PURPOSE_OPTIONS = [
  "Job work",
  "Sale on approval",
  "Sales return",
  "Supply of goods",
  "Other",
] as const;

export const INVOICE_FORM_CONFIG: FormConfig = {
  kind: "invoice",
  title: "New Invoice",
  rpc: "create_invoice",
  numberTable: "invoices",
  numberColumn: "invoice_no",
  hasRate: true,
  draftStorageKey: "jms:draft:invoice",
  maxLines: 18, // the print template's real capacity — see docs/PRINT.md
};

export const DC_FORM_CONFIG: FormConfig = {
  kind: "dc",
  title: "New Delivery Challan",
  rpc: "create_dc",
  numberTable: "delivery_challans",
  numberColumn: "dc_no",
  hasRate: false,
  purposeOptions: DC_PURPOSE_OPTIONS,
  draftStorageKey: "jms:draft:dc",
  maxLines: 18,
};
