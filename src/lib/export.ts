import { supabase } from "./supabase";

/** One-click CSV export (docs/DECISIONS.md — backups decision). Not a
 * substitute for Supabase's own scheduled backups, verified separately
 * in the dashboard — this is what your accountant actually wants at
 * filing time: one file, one sheet, every invoice. */
export async function exportInvoicesCsv(): Promise<void> {
  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_no,date,customer_snapshot,subtotal,sgst_pct,sgst,cgst_pct,cgst,round_off,total,status,cancelled_reason")
    .order("invoice_no");
  if (error) throw error;

  const header = [
    "Invoice No", "Date", "Customer", "GSTIN", "Subtotal",
    "SGST %", "SGST", "CGST %", "CGST", "Round Off", "Total",
    "Status", "Cancelled Reason",
  ];
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = (data ?? []).map((r) => {
    const customer = r.customer_snapshot as { name?: string; gstin?: string } | null;
    return [
      r.invoice_no, r.date, customer?.name ?? "", customer?.gstin ?? "",
      r.subtotal, r.sgst_pct, r.sgst, r.cgst_pct, r.cgst, r.round_off, r.total,
      r.status, r.cancelled_reason ?? "",
    ].map(escape).join(",");
  });
  const csv = [header.join(","), ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `jms-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
