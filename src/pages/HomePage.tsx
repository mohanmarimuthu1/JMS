import { Link } from "react-router-dom";

/**
 * Placeholder landing page for Slice 1. The real app shell (tabs for
 * New Invoice / DC / History / Customers / Items / Settings) lands in
 * Slices 3-6. This page exists only so Slice 1's print-fidelity work
 * has an entry point to test from, on both desktop and the shop phone.
 */
export function HomePage() {
  return (
    <div className="min-h-screen bg-paper p-8 mono text-ink">
      <h1 className="text-2xl font-bold headline mb-2">JMS Engineering — Billing</h1>
      <p className="text-sm text-muted mb-6">
        Slice 1: print engine under construction. Use the fixtures below to
        test print fidelity against the shop's physical bill book.
      </p>
      <div className="flex flex-col gap-2 max-w-xs">
        <Link
          to="/print/fixture/invoice-min"
          className="px-4 py-2 bg-white border border-ink rounded-sm text-center"
        >
          Invoice fixture — minimal (1 line)
        </Link>
        <Link
          to="/print/fixture/invoice-max"
          className="px-4 py-2 bg-white border border-ink rounded-sm text-center"
        >
          Invoice fixture — max (18 lines, page break)
        </Link>
        <Link
          to="/print/fixture/dc-max"
          className="px-4 py-2 bg-white border border-ink rounded-sm text-center"
        >
          Delivery challan fixture
        </Link>
      </div>
    </div>
  );
}
