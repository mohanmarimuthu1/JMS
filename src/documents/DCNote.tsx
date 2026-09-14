import type { PrintableDocument } from "./types";

/** Footer for a DELIVERY CHALLAN: no totals, no amount-in-words — DCs
 * carry no tax (billing-system.jsx:1046). */
export function DCNote({ doc }: { doc: PrintableDocument }) {
  const purposeText = (
    doc.purpose === "Other" ? doc.purposeNote : doc.purpose
  )?.toLowerCase();
  return (
    <div className="doc-footer border-t-2 border-ink p-2 text-[10px] text-muted">
      Note: Goods dispatched as above — no sale, for{" "}
      {purposeText || "the stated"} purposes only. GST not charged on this
      document.
    </div>
  );
}
