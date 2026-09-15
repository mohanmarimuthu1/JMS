import type { PrintableDocument } from "./types";
import { money } from "@/lib/money";

/**
 * Words + totals footer for a TAX INVOICE. Renders `amountInWords`
 * verbatim — it must never be recomputed here. See docs/DECISIONS.md #6.
 */
export function InvoiceTotals({ doc }: { doc: PrintableDocument }) {
  return (
    <div
      className="doc-footer grid border-t-2 border-ink"
      style={{ gridTemplateColumns: `1fr ${42}mm` }}
    >
      <div className="p-2 flex items-start">
        <span>{doc.amountInWords ?? ""}</span>
      </div>
      <div className="border-l border-ink divide-y divide-ink">
        <div className="flex justify-between px-2 py-1">
          <span>Sub Total</span>
          <span>{money(doc.subtotal)}</span>
        </div>
        {/* Inter-state supply: IGST replaces SGST+CGST, never both —
            mirrors the inv_tax_mode CHECK constraint in
            supabase/schema.sql, which makes storing both impossible. */}
        {doc.supplyType === "inter" ? (
          <div className="flex justify-between px-2 py-1">
            <span>IGST @{doc.igstPct ?? 0}%</span>
            <span>{money(doc.igst)}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between px-2 py-1">
              <span>SGST @{doc.sgstPct ?? 0}%</span>
              <span>{money(doc.sgst)}</span>
            </div>
            <div className="flex justify-between px-2 py-1">
              <span>CGST @{doc.cgstPct ?? 0}%</span>
              <span>{money(doc.cgst)}</span>
            </div>
          </>
        )}
        {doc.roundOff != null && doc.roundOff !== 0 && (
          <div className="flex justify-between px-2 py-1">
            <span>Round Off</span>
            <span>
              {doc.roundOff > 0 ? "+" : ""}
              {money(doc.roundOff)}
            </span>
          </div>
        )}
        <div className="flex justify-between px-2 py-1 font-bold">
          <span>Total</span>
          <span>{money(doc.total)}</span>
        </div>
      </div>
    </div>
  );
}
