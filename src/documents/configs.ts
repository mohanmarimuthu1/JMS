import type { DocConfig } from "./types";
import { money, formatDateDDMMYYYY } from "@/lib/money";

/** Canonical column widths, decided once here (see types.ts comment and
 * docs/DECISIONS.md, Open Item #3) rather than inherited by accident. */
export const META_COL_WIDTH = "42mm";
export const SEAL_SIZE = "18mm";

export const INVOICE_CONFIG: DocConfig = {
  kind: "invoice",
  title: "TAX INVOICE",
  numberLabel: "No.",
  metaColWidth: META_COL_WIDTH,
  showPartyGstinRow: true,
  referenceFields: [
    {
      label: "Your Order No. & Date",
      render: (doc) =>
        doc.orderNo
          ? `${doc.orderNo}${doc.orderDate ? ` (${formatDateDDMMYYYY(doc.orderDate)})` : ""}`
          : "—",
    },
    {
      label: "Our DC. No. & Date",
      render: (doc) =>
        doc.dcNoManual
          ? `${doc.dcNoManual}${doc.dcDateManual ? ` (${formatDateDDMMYYYY(doc.dcDateManual)})` : ""}`
          : "—",
    },
  ],
  lineColumns: [
    {
      header: "S. No.",
      width: "10mm",
      align: "center",
      render: (_l, i) => String(i + 1),
    },
    {
      header: "Description of Goods",
      width: "auto",
      align: "left",
      render: (l) => l?.description ?? "",
    },
    {
      header: "HSN Code",
      width: "20mm",
      align: "center",
      render: (l) => l?.hsn ?? "",
    },
    {
      header: "Qty.",
      width: "16mm",
      align: "right",
      render: (l) => (l ? String(l.qty) : ""),
    },
    {
      header: "Rate Rs.",
      width: "22mm",
      align: "right",
      render: (l) => (l && l.rate != null ? money(l.rate) : ""),
    },
    {
      header: "Amount Rs.",
      width: "26mm",
      align: "right",
      render: (l) =>
        l && l.amount != null
          ? money(l.amount)
          : l && l.rate != null
            ? money(l.qty * l.rate)
            : "",
    },
  ],
  minRows: 6,
  footer: "totals",
  signatureSlots: ["authorised"],
};

export const DC_CONFIG: DocConfig = {
  kind: "dc",
  title: "DELIVERY CHALLAN",
  numberLabel: "DC No.",
  metaColWidth: META_COL_WIDTH,
  showPartyGstinRow: false,
  referenceFields: [
    { label: "Ref / Order No.", render: (doc) => doc.refNo || "—" },
    {
      label: "Purpose",
      render: (doc) =>
        doc.purpose === "Other" && doc.purposeNote
          ? doc.purposeNote
          : doc.purpose || "—",
    },
  ],
  lineColumns: [
    {
      header: "S. No.",
      width: "10mm",
      align: "center",
      render: (_l, i) => String(i + 1),
    },
    {
      header: "Description of Goods",
      width: "auto",
      align: "left",
      render: (l) => l?.description ?? "",
    },
    {
      header: "HSN Code",
      width: "24mm",
      align: "center",
      render: (l) => l?.hsn ?? "",
    },
    {
      header: "Qty.",
      width: "20mm",
      align: "right",
      render: (l) => (l ? String(l.qty) : ""),
    },
  ],
  minRows: 6,
  footer: "note",
  signatureSlots: ["receiver", "authorised"],
};

export function configFor(kind: "invoice" | "dc"): DocConfig {
  return kind === "invoice" ? INVOICE_CONFIG : DC_CONFIG;
}
