import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { fetchCustomers, type CustomerListRow } from "@/lib/customers";

/** Entry point into a company's bill folder (CustomerBillsPage) — pick
 * the company here, then see all its invoices/DCs by date and time. */
export function CustomersPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<CustomerListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        setRows(await fetchCustomers(query));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load companies.");
      } finally {
        setLoading(false);
      }
    }, 250); // debounce, same as History (lib/history.ts)
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto p-4 mono">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold headline">Companies</h1>
        <Link to="/" className="text-sm text-muted">Back</Link>
      </div>

      <div className="relative mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search companies by name"
          className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px] pr-9"
        />
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
      </div>

      {error && <div className="text-sm text-rust border border-rust/60 bg-rust/5 rounded-sm p-3 mb-4">{error}</div>}
      {loading && <div className="text-sm text-muted">Loading…</div>}
      {!loading && rows.length === 0 && (
        <div className="text-sm text-muted">No companies found.</div>
      )}

      <div className="space-y-2">
        {rows.map((c) => (
          <Link
            key={c.id}
            to={`/customers/${c.id}`}
            className="block border border-rule rounded-sm p-3 bg-white hover:border-rust"
          >
            <div className="font-semibold text-sm">{c.name}</div>
            {c.address && <div className="text-xs text-muted mt-0.5">{c.address}</div>}
            {c.gstin && <div className="text-xs text-muted">GSTIN: {c.gstin}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
