import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Printer, X, Download } from "lucide-react";
import { fetchHistory, cancelDocument, type DocumentRow, type HistoryFilter } from "@/lib/history";
import { exportInvoicesCsv } from "@/lib/export";
import { formatDateDDMMYYYY, money } from "@/lib/money";

export function HistoryPage() {
  const [filter, setFilter] = useState<HistoryFilter>({ query: "", type: "all" });
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null); // row key being cancelled
  const [reason, setReason] = useState("");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportInvoicesCsv();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchHistory(filter));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(reload, 250); // debounce search typing
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.query, filter.type]);

  async function handleCancel(row: DocumentRow) {
    if (!reason.trim()) return;
    try {
      await cancelDocument(row.kind, row.doc_no, reason.trim());
      setCancelling(null);
      setReason("");
      await reload(); // never assume — reload from the DB, the source of truth
    } catch (e) {
      // Never fail silently — keep the reason typed so the operator can retry.
      setError(e instanceof Error ? e.message : "Cancel failed.");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 mono">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold headline">History</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 min-h-[36px] border border-rule rounded-sm disabled:opacity-50"
          >
            <Download size={14} /> {exporting ? "Exporting…" : "Export CSV"}
          </button>
          <Link to="/" className="text-sm text-muted">Back</Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input
            value={filter.query}
            onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
            placeholder="Search by customer name or document number"
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
        <div className="text-sm text-muted">No documents found.</div>
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
                <span className={cancelled ? "line-through text-rust" : ""}>{row.customer_name ?? "—"}</span>
                <span className="text-muted">{formatDateDDMMYYYY(row.date)}</span>
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
