import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { PrintShell } from "@/documents/PrintShell";
import { PrintPageChrome } from "@/documents/PrintPageChrome";
import { configFor } from "@/documents/configs";
import type { PrintableDocument, PrintableParty } from "@/documents/types";
import type { BusinessDetails } from "@/config/business";

type SellerSnapshot = {
  name: string;
  address_line: string | null;
  cell: string | null;
  gstin: string | null;
  jurisdiction: string | null;
};

function sellerFromSnapshot(s: SellerSnapshot): BusinessDetails {
  return {
    name: s.name,
    addressLine: s.address_line ?? "",
    cell: s.cell ?? "",
    gstin: s.gstin ?? "",
    jurisdiction: s.jurisdiction ?? "",
    stateCode: "",
    gstSplitPct: 0,
  };
}

/**
 * The real print route — /print/invoice/:no or /print/dc/:no. Reads
 * the frozen customer_snapshot/seller_snapshot off the row, never a
 * live join to customers/settings, so a reprint years later is
 * byte-identical to the original even if the customer moved or the
 * business's details changed since (docs/DECISIONS.md #8).
 */
export function PrintDocumentPage({ kind }: { kind: "invoice" | "dc" }) {
  const { no } = useParams<{ no: string }>();
  const [doc, setDoc] = useState<PrintableDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (kind === "invoice") {
        const [{ data: inv, error: invErr }, { data: lines, error: lineErr }] = await Promise.all([
          supabase.from("invoices").select("*").eq("invoice_no", no).single(),
          supabase.from("invoice_lines").select("*").eq("invoice_no", no).order("line_order"),
        ]);
        if (cancelled) return;
        if (invErr || !inv) { setError(invErr?.message ?? "Invoice not found"); return; }
        const customer = inv.customer_snapshot as PrintableParty;
        setDoc({
          kind: "invoice",
          docNo: inv.invoice_no,
          date: inv.date,
          customer,
          seller: sellerFromSnapshot(inv.seller_snapshot as SellerSnapshot),
          orderNo: inv.order_no,
          orderDate: inv.order_date,
          subtotal: Number(inv.subtotal),
          sgstPct: Number(inv.sgst_pct),
          sgst: Number(inv.sgst),
          cgstPct: Number(inv.cgst_pct),
          cgst: Number(inv.cgst),
          igstPct: Number(inv.igst_pct),
          igst: Number(inv.igst),
          supplyType: inv.supply_type,
          roundOff: Number(inv.round_off),
          total: Number(inv.total),
          amountInWords: inv.amount_in_words,
          status: inv.status,
          cancelledAt: inv.cancelled_at,
          cancelledReason: inv.cancelled_reason,
          lines: (lines ?? []).map((l) => ({
            description: l.description, hsn: l.hsn, qty: Number(l.qty), rate: Number(l.rate), amount: Number(l.amount),
          })),
        });
        if (lineErr) setError(lineErr.message);
      } else {
        const [{ data: dc, error: dcErr }, { data: lines, error: lineErr }] = await Promise.all([
          supabase.from("delivery_challans").select("*").eq("dc_no", no).single(),
          supabase.from("dc_lines").select("*").eq("dc_no", no).order("line_order"),
        ]);
        if (cancelled) return;
        if (dcErr || !dc) { setError(dcErr?.message ?? "Delivery challan not found"); return; }
        const customer = dc.customer_snapshot as PrintableParty;
        setDoc({
          kind: "dc",
          docNo: dc.dc_no,
          date: dc.date,
          customer,
          seller: sellerFromSnapshot(dc.seller_snapshot as SellerSnapshot),
          refNo: dc.ref_no,
          purpose: dc.purpose,
          purposeNote: dc.purpose_note,
          status: dc.status,
          cancelledAt: dc.cancelled_at,
          cancelledReason: dc.cancelled_reason,
          lines: (lines ?? []).map((l) => ({ description: l.description, hsn: l.hsn, qty: Number(l.qty) })),
        });
        if (lineErr) setError(lineErr.message);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [kind, no]);

  if (error) {
    return (
      <PrintPageChrome>
        <div className="max-w-md mx-auto bg-white border border-rust rounded-sm p-4 text-rust">{error}</div>
      </PrintPageChrome>
    );
  }
  if (!doc) {
    return (
      <PrintPageChrome>
        <div className="max-w-md mx-auto p-4 text-muted">Loading…</div>
      </PrintPageChrome>
    );
  }

  return (
    <PrintPageChrome>
      <PrintShell config={configFor(kind)} doc={doc} />
    </PrintPageChrome>
  );
}
