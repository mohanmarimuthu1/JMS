import { useParams, Link } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import { PrintShell } from "@/documents/PrintShell";
import { configFor } from "@/documents/configs";
import type { PrintableDocument } from "@/documents/types";

import invoiceMin from "@/fixtures/invoice-min.json";
import invoiceMax from "@/fixtures/invoice-max.json";
import dcMax from "@/fixtures/dc-max.json";

/**
 * The permanent print regression harness (docs/PRINT.md). Every future
 * change to PrintShell should be re-checked against all three fixtures
 * in under a minute: open each URL, print, compare against the shop's
 * physical bill.
 */
const FIXTURES: Record<string, PrintableDocument> = {
  "invoice-min": invoiceMin as PrintableDocument,
  "invoice-max": invoiceMax as PrintableDocument,
  "dc-max": dcMax as PrintableDocument,
};

export function PrintFixturePage() {
  const { name } = useParams<{ name: string }>();
  const doc = name ? FIXTURES[name] : undefined;

  if (!doc) {
    return (
      <div className="p-8">
        <p>
          Unknown fixture "{name}". Available:{" "}
          {Object.keys(FIXTURES).join(", ")}
        </p>
        <Link to="/" className="text-rust underline">
          Back
        </Link>
      </div>
    );
  }

  const config = configFor(doc.kind);

  return (
    <div className="min-h-screen bg-paper py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex justify-between px-4" style={{ width: "190mm" }}>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm px-3 py-2 border border-ink rounded-sm bg-white"
        >
          <ArrowLeft size={15} /> Back
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-sm px-4 py-2 bg-rust text-white rounded-sm"
        >
          <Printer size={15} /> Print / Save PDF
        </button>
      </div>
      <PrintShell config={config} doc={doc} />
    </div>
  );
}
