import { useParams, Link } from "react-router-dom";
import { PrintShell } from "@/documents/PrintShell";
import { PrintPageChrome } from "@/documents/PrintPageChrome";
import { configFor } from "@/documents/configs";
import type { PrintableDocument } from "@/documents/types";

import invoiceMin from "@/fixtures/invoice-min.json";
import invoiceMax from "@/fixtures/invoice-max.json";
import invoiceInterstate from "@/fixtures/invoice-interstate.json";
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
  "invoice-interstate": invoiceInterstate as PrintableDocument,
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

  return (
    <PrintPageChrome>
      <PrintShell config={configFor(doc.kind)} doc={doc} />
    </PrintPageChrome>
  );
}
