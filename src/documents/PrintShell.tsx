import logoUrl from "@/assets/logo.jpg";
import { formatDateDDMMYYYY } from "@/lib/money";
import type { DocConfig, PrintableDocument } from "./types";
import { InvoiceTotals } from "./InvoiceTotals";
import { DCNote } from "./DCNote";
import { CancelledWatermark } from "./CancelledWatermark";
import { SEAL_SIZE } from "./configs";

/**
 * The single print template both document types render through.
 * Reconciles the prototype's invoice/DC drift (150px vs 170px title
 * column, w-16 vs w-14 seal) into one canonical layout, driven by
 * `config`. See docs/ARCHITECTURE.md "One document engine".
 *
 * Sizing is in mm, not Tailwind's px-based scale, because the page
 * itself is pinned with `@page { size: A4 }` (src/index.css) — every
 * dimension here is a deliberate re-derivation of the prototype's
 * pixel box, not an accident of browser shrink-to-fit.
 */
export function PrintShell({
  config,
  doc,
}: {
  config: DocConfig;
  doc: PrintableDocument;
}) {
  const rows = Math.max(doc.lines.length, config.minRows);
  const padded: (PrintableDocument["lines"][number] | null)[] = [
    ...doc.lines,
    ...Array(Math.max(0, rows - doc.lines.length)).fill(null),
  ];

  return (
    <div
      className="relative mx-auto bg-white border-2 border-ink mono text-[12.5px] text-ink"
      style={{ width: "190mm" }}
    >
      {doc.status === "cancelled" && <CancelledWatermark />}

      {/* Header: logo + company */}
      <div className="doc-header flex items-center gap-4 p-3 border-b-2 border-ink">
        <img
          src={logoUrl}
          alt="Company seal logo"
          className="rounded-full object-cover shrink-0 border border-ink"
          style={{ width: SEAL_SIZE, height: SEAL_SIZE }}
        />
        <div className="flex-1 text-center" style={{ paddingRight: SEAL_SIZE }}>
          <div className="text-[22px] font-bold tracking-wide leading-tight font-sans">
            {doc.seller.name}
          </div>
          <div className="text-[11px] mt-1">{doc.seller.addressLine}</div>
        </div>
      </div>

      {/* Cell / GSTIN / Title */}
      <div
        className="grid border-b-2 border-ink"
        style={{ gridTemplateColumns: `1fr 1fr ${config.metaColWidth}` }}
      >
        <div className="p-2 border-r border-ink">
          Cell : {doc.seller.cell || "—"}
        </div>
        <div className="p-2 border-r border-ink">
          GSTIN : {doc.seller.gstin || "—"}
        </div>
        <div className="p-2 flex items-center justify-center text-center font-bold tracking-wide">
          {config.title}
        </div>
      </div>

      {/* To M/s + No/Date */}
      <div
        className="grid border-b border-ink"
        style={{ gridTemplateColumns: `1fr ${config.metaColWidth}` }}
      >
        <div className="p-2 border-r border-ink">
          <div>To, M/s. {doc.customer.name}</div>
          <div>{doc.customer.address}</div>
          {!config.showPartyGstinRow && doc.customer.gstin && (
            <div>GSTIN: {doc.customer.gstin}</div>
          )}
        </div>
        <div className="p-2">
          <div>
            {config.numberLabel} : <b>{doc.docNo}</b>
          </div>
          <div>Date : {formatDateDDMMYYYY(doc.date)}</div>
        </div>
      </div>

      {/* Party's GSTIN (invoice only) */}
      {config.showPartyGstinRow && (
        <div className="p-2 border-b border-ink">
          Party&apos;s GSTIN :{" "}
          {doc.customer.gstin || (
            <span className="inline-block border-b border-dotted border-ink w-40">
              &nbsp;
            </span>
          )}
        </div>
      )}

      {/* Reference fields */}
      <div className="grid grid-cols-2 border-b-2 border-ink">
        {config.referenceFields.map((f) => (
          <div key={f.label} className="p-2 border-r border-ink last:border-r-0">
            {f.label} : {f.render(doc)}
          </div>
        ))}
      </div>

      {/* Line items */}
      <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
        <colgroup>
          {config.lineColumns.map((c) => (
            <col key={c.header} style={{ width: c.width }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b-2 border-ink">
            {config.lineColumns.map((c, i) => (
              <th
                key={c.header}
                className={`p-1.5 font-semibold ${i < config.lineColumns.length - 1 ? "border-r border-ink" : ""}`}
                style={{ textAlign: c.align }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {padded.map((line, idx) => (
            <tr key={idx} className="border-b border-rule" style={{ minHeight: "6mm" }}>
              {config.lineColumns.map((c, i) => (
                <td
                  key={c.header}
                  className={`p-1 align-top whitespace-pre-wrap ${i < config.lineColumns.length - 1 ? "border-r border-ink" : ""}`}
                  style={{ textAlign: c.align }}
                >
                  {c.render(line, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer: totals or note */}
      {config.footer === "totals" ? (
        <InvoiceTotals doc={doc} />
      ) : (
        <DCNote doc={doc} />
      )}

      {doc.status === "cancelled" && (
        <div className="doc-footer border-t-2 border-ink p-2 text-[10px] text-rust font-semibold">
          CANCELLED on {formatDateDDMMYYYY(doc.cancelledAt)} — reason:{" "}
          {doc.cancelledReason}
        </div>
      )}

      {/* Jurisdiction + signature/seal */}
      <div
        className="doc-footer grid border-t-2 border-ink"
        style={{
          gridTemplateColumns: `1fr ${config.signatureSlots
            .map(() => "40mm")
            .join(" ")}`,
        }}
      >
        <div className="p-2 text-[10px] text-muted self-end">
          {doc.seller.jurisdiction &&
            `Subject to ${doc.seller.jurisdiction} Jurisdiction`}
        </div>
        {config.signatureSlots.map((slot) => (
          <div
            key={slot}
            className="border-l border-ink p-3 text-center relative"
          >
            {slot === "authorised" ? (
              <>
                <div className="font-medium mb-1">For {doc.seller.name}</div>
                <div className="relative h-16 flex items-center justify-center">
                  <div
                    className="rounded-full border border-dashed border-muted flex items-center justify-center text-[8px] text-muted tracking-wide"
                    style={{ width: SEAL_SIZE, height: SEAL_SIZE }}
                  >
                    SEAL
                  </div>
                </div>
                <div className="border-t border-ink pt-1 mt-1">
                  Authorised Signatory
                </div>
              </>
            ) : (
              <>
                <div className="h-10" />
                <div className="border-t border-ink pt-1 mt-1">
                  Receiver&apos;s Signature
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
