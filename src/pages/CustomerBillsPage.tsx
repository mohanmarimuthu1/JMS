import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, Printer, X } from "lucide-react";
import { fetchHistory, cancelDocument, type DocumentRow, type HistoryFilter } from "@/lib/history";
import { fetchCustomer, type CustomerListRow } from "@/lib/customers";
import { formatDateDDMMYYYY, formatTimeHHMM, money } from "@/lib/money";

/** A single company's bill folder — every invoice/DC issued to them,
 * newest first, with its own search and a type filter. Reuses the same
 * fetchHistory/cancelDocument path as HistoryPage, just scoped by
 * customerId (see the `documents` view in supabase/schema.sql). */
export function CustomerBillsPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerListRow | null>(null);
  const [filter, setFilter] = useState<Omit<HistoryFilter, "customerId">>({ query: "", type: "all" });
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!id) return;
    fetchCustomer(id)
      .then(setCustomer)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load company."));
  }, [id]);

  async function reload() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchHistory({ ...filter, customerId: id }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bills.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(reload, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.query, filter.type, id]);

  async function handleCancel(row: DocumentRow) {
    if (!reason.trim()) return;
    try {
      await cancelDocument(row.kind, row.doc_no, reason.trim());
      setCancelling(null);
      setReason("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cancel failed.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 mono">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold headline">{customer?.name ?? "Company"}</h1>
        <Link to="/customers" className="text-sm text-muted">Back to companies</Link>
      </div>
      {customer?.address && <div className="text-xs text-muted mb-1">{customer.address}</div>}
      {customer?.gstin && <div className="text-xs text-muted mb-4">GSTIN: {customer.gstin}</div>}

      <div className="flex flex-col sm:flex-row gap-3 mb-4 mt-3">
        <div className="relative flex-1">
          <input
            value={filter.query}
            onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
            placeholder="Search this company's bills by number"
            className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px] pr-9"
          />
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
        </div>
        <select
          value={filter.type}
          onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value as HistoryFilter["type"] }))}
          className="border border-rule rounded-sm px-3 py-2 min-h-[44px]"
        >
          <option value="all">All</option>
          <option value="invoice">Invoices</option>
          <option value="dc">Delivery Challans</option>
        </select>
      </div>

      {error && <div className="text-sm text-rust border border-rust/60 bg-rust/5 rounded-sm p-3 mb-4">{error}</div>}
      {loading && <div className="text-sm text-muted">Loading…</div>}
      {!loading && rows.length === 0 && (
        <div className="text-sm text-muted">No bills for this company yet.</div>
      )}

      <div className="space-y-2">
        {rows.map((row) => {
          const key = `${row.kind}-${row.doc_no}`;
          const cancelled = row.status === "cancelled";
          return (
            <div
              key={key}
              className={`border border-rule rounded-sm p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${cancelled ? "opacity-60" : "bg-white"}`}
            >
              <div className="flex-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold">
                  {row.kind === "invoice" ? "Invoice" : "DC"} #{row.doc_no}
                </span>
                <span className="text-muted">
                  {formatDateDDMMYYYY(row.date)} · {formatTimeHHMM(row.created_at)}
                </span>
                {row.total != null && <span className="text-muted">₹{money(row.total)}</span>}
                {cancelled && <span className="text-rust font-semibold">CANCELLED</span>}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/print/${row.kind}/${row.doc_no}`}
                  className="flex items-center gap-1 text-xs px-2 py-1.5 min-h-[36px] border border-rule rounded-sm"
                >
                  <Printer size={13} /> {cancelled ? "View" : "Print"}
                </Link>
                {!cancelled && cancelling !== key && (
                  <button
                    onClick={() => { setCancelling(key); setReason(""); }}
                    className="text-xs px-2 py-1.5 min-h-[36px] text-rust border border-rust/50 rounded-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {cancelling === key && (
                <div className="w-full flex items-center gap-2 mt-1">
                  <input
                    autoFocus
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for cancelling (required)"
                    className="flex-1 border border-rust rounded-sm px-2 py-1.5 min-h-[36px] text-sm"
                  />
                  <button
                    onClick={() => handleCancel(row)}
                    disabled={!reason.trim()}
                    className="text-xs px-3 py-1.5 min-h-[36px] bg-rust text-white rounded-sm disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button onClick={() => setCancelling(null)} className="p-1.5 text-muted" aria-label="Dismiss">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
