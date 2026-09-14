/**
 * Diagonal CANCELLED overlay. Not wired into any real flow until Slice
 * 5 (there is no cancel action yet), but built into the shared shell
 * now so a cancelled document can never render indistinguishably from
 * a live one by omission later. print-color-adjust keeps it visible
 * under "Save as PDF". See docs/DECISIONS.md, cancellation model.
 */
export function CancelledWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
    >
      <span
        className="select-none font-bold uppercase text-rust/60"
        style={{
          fontSize: "26mm",
          letterSpacing: "0.05em",
          transform: "rotate(-30deg)",
          border: "2mm solid currentColor",
          padding: "0 6mm",
        }}
      >
        Cancelled
      </span>
    </div>
  );
}
