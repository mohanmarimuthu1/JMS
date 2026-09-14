import { Link } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

/** Shared no-print toolbar + page frame for both the fixture harness
 * (Slice 1) and the real database-backed print page (Slice 3). */
export function PrintPageChrome({ children, backTo = "/" }: { children: ReactNode; backTo?: string }) {
  return (
    <div className="min-h-screen bg-paper py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex justify-between px-4" style={{ width: "190mm" }}>
        <Link to={backTo} className="flex items-center gap-1.5 text-sm px-3 py-2 border border-ink rounded-sm bg-white">
          <ArrowLeft size={15} /> Back
        </Link>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-rust text-white rounded-sm">
          <Printer size={15} /> Print / Save PDF
        </button>
      </div>
      {children}
    </div>
  );
}
