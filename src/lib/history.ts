import { supabase } from "./supabase";

export interface DocumentRow {
  kind: "invoice" | "dc";
  doc_no: number;
  id: string;
  date: string;
  status: "issued" | "cancelled";
  customer_id: string | null;
  customer_name: string | null;
  total: number | null;
  created_at: string;
}

export interface HistoryFilter {
  query: string;
  type: "all" | "invoice" | "dc";
  /** Scopes results to one customer's bill folder (CustomerBillsPage). */
  customerId?: string;
}

/**
 * Server-side search/filter against the `documents` view — the
 * prototype did all of this in JS over the full in-memory array
 * (billing-system.jsx:669-678) and sorted on the `date` string alone,
 * so same-day documents had no deterministic order.
 */
export async function fetchHistory(filter: HistoryFilter): Promise<DocumentRow[]> {
  let q = supabase
    .from("documents")
    .select("*")
    .order("date", { ascending: false })
    .order("doc_no", { ascending: false })
    .limit(100);

  if (filter.type !== "all") q = q.eq("kind", filter.type);
  if (filter.customerId) q = q.eq("customer_id", filter.customerId);
  if (filter.query.trim()) {
    const term = filter.query.trim();
    const asNumber = Number(term);
    q = Number.isFinite(asNumber) && term !== ""
      ? q.or(`customer_name.ilike.%${term}%,doc_no.eq.${asNumber}`)
      : q.ilike("customer_name", `%${term}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function cancelDocument(kind: "invoice" | "dc", docNo: number, reason: string) {
  const rpc = kind === "invoice" ? "cancel_invoice" : "cancel_dc";
  const param = kind === "invoice" ? "p_invoice_no" : "p_dc_no";
  const { error } = await supabase.rpc(rpc, { [param]: docNo, p_reason: reason });
  if (error) throw error;
}
