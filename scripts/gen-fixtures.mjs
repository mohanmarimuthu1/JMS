// Generates the committed print-regression fixtures (src/fixtures/*.json).
// This is a build-time tool, not shipped app code — in the real app,
// amount-in-words is a column computed once in Postgres and frozen on
// the row (see supabase/schema.sql, num_to_words_inr). This script's
// wordsInr() is a JS mirror of that same algorithm, used only so the
// fixtures are internally consistent (words actually match the total).
import { writeFileSync, mkdirSync } from "node:fs";

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowThousand(n) {
  if (n <= 0) return "";
  const h = Math.floor(n / 100);
  const r = n % 100;
  let out = "";
  if (h > 0) out += `${ONES[h]} Hundred`;
  if (r > 0) {
    if (out) out += " ";
    out += r < 20 ? ONES[r] : TENS[Math.floor(r / 10)] + (r % 10 ? ` ${ONES[r % 10]}` : "");
  }
  return out;
}

export function wordsInr(amount) {
  let whole = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - whole) * 100);
  if (whole === 0 && paise === 0) return "Rupees Zero Only";
  const crore = Math.floor(whole / 1e7); whole %= 1e7;
  const lakh = Math.floor(whole / 1e5); whole %= 1e5;
  const thou = Math.floor(whole / 1e3); whole %= 1e3;
  const rest = whole;
  let out = "";
  if (crore) out += `${belowThousand(crore)} Crore `;
  if (lakh) out += `${belowThousand(lakh)} Lakh `;
  if (thou) out += `${belowThousand(thou)} Thousand `;
  if (rest) out += belowThousand(rest);
  out = `Rupees ${out.trim().replace(/\s+/g, " ")}`;
  if (paise > 0) out += ` and ${belowThousand(paise)} Paise`;
  return `${out} Only`;
}

function computeInvoiceTotals(lines, gstPct) {
  const withAmount = lines.map((l) => ({ ...l, amount: Math.round(l.qty * l.rate * 100) / 100 }));
  const subtotal = Math.round(withAmount.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  const sgst = Math.round(subtotal * (gstPct / 100) * 100) / 100;
  const cgst = Math.round(subtotal * (gstPct / 100) * 100) / 100;
  const gross = subtotal + sgst + cgst;
  const total = Math.round(gross);
  const roundOff = Math.round((total - gross) * 100) / 100;
  return {
    lines: withAmount, subtotal, sgstPct: gstPct, sgst, cgstPct: gstPct, cgst,
    igstPct: 0, igst: 0, supplyType: "intra",
    roundOff, total, amountInWords: wordsInr(total),
  };
}

// Inter-state: IGST replaces SGST+CGST, never both — mirrors the
// inv_tax_mode CHECK constraint in supabase/schema.sql.
function computeInterstateTotals(lines, igstPct) {
  const withAmount = lines.map((l) => ({ ...l, amount: Math.round(l.qty * l.rate * 100) / 100 }));
  const subtotal = Math.round(withAmount.reduce((s, l) => s + l.amount, 0) * 100) / 100;
  const igst = Math.round(subtotal * (igstPct / 100) * 100) / 100;
  const gross = subtotal + igst;
  const total = Math.round(gross);
  const roundOff = Math.round((total - gross) * 100) / 100;
  return {
    lines: withAmount, subtotal, sgstPct: 0, sgst: 0, cgstPct: 0, cgst: 0,
    igstPct, igst, supplyType: "inter",
    roundOff, total, amountInWords: wordsInr(total),
  };
}

const seller = {
  name: "JMS ENGINEERING",
  addressLine: "1/2, 39-B-16, Aringar Anna Colony, SIDCO Industrial Estate, Coimbatore - 641 021.",
  cell: "8610026754, 7708881444",
  gstin: "33BBJPJ1166M1ZJ",
  stateCode: "33",
  gstSplitPct: 9,
  jurisdiction: "Coimbatore",
};

// ---- invoice-min: 1 line, no order no. ----
const invoiceMinTotals = computeInvoiceTotals(
  [{ description: "Precision turned bush, MS", hsn: "8466", qty: 10, rate: 45 }],
  9,
);
const invoiceMin = {
  kind: "invoice",
  docNo: 101,
  date: "2026-09-14",
  customer: { name: "Sri Balaji Traders", address: "Ganapathy, Coimbatore - 641006", gstin: null },
  seller,
  orderNo: null,
  orderDate: null,
  dcNoManual: null,
  dcDateManual: null,
  status: "issued",
  ...invoiceMinTotals,
};

// ---- invoice-max: 18 lines, long descriptions, no GSTIN, forces a page break ----
const maxLines = Array.from({ length: 18 }, (_, i) => ({
  description: `CNC turned component, EN8 grade, OD 42mm x 118mm, precision ground to +/-0.02mm tolerance, phosphate coated — batch #${1000 + i}`,
  hsn: "8466",
  qty: 24 + i,
  rate: 1875.5 + i * 12.25,
}));
const invoiceMaxTotals = computeInvoiceTotals(maxLines, 9);
const invoiceMax = {
  kind: "invoice",
  docNo: 214,
  date: "2026-09-14",
  customer: { name: "Kaveri Precision Components Pvt Ltd", address: "Plot 14, SIDCO Industrial Estate, Coimbatore - 641021", gstin: null },
  seller,
  orderNo: "PO-4471",
  orderDate: "2026-09-01",
  dcNoManual: "187",
  dcDateManual: "2026-09-10",
  status: "issued",
  ...invoiceMaxTotals,
};

// sanity: this fixture must exceed the template's real capacity (18 lines)
// and land near the ₹12,34,567+ figure the plan calls for.
if (invoiceMax.total < 1000000) {
  throw new Error(`invoice-max total too small to exercise a big number: ${invoiceMax.total}`);
}

// ---- invoice-interstate: IGST instead of SGST+CGST ----
const interstateTotals = computeInterstateTotals(
  [{ description: "Precision shaft, EN24 grade, ground finish", hsn: "8466", qty: 15, rate: 620 }],
  18,
);
const invoiceInterstate = {
  kind: "invoice",
  docNo: 217,
  date: "2026-09-15",
  customer: { name: "Bangalore Precision Works", address: "Peenya Industrial Area, Bangalore - 560058", gstin: "29AAFCK1234L1ZP" },
  seller,
  orderNo: "PO-9981",
  orderDate: "2026-09-10",
  dcNoManual: null,
  dcDateManual: null,
  status: "issued",
  ...interstateTotals,
};

// ---- dc-max: no money, purpose = Job work ----
const dcMax = {
  kind: "dc",
  docNo: 187,
  date: "2026-09-10",
  customer: { name: "Kaveri Precision Components Pvt Ltd", address: "Plot 14, SIDCO Industrial Estate, Coimbatore - 641021", gstin: "33AAFCK1234L1ZP" },
  seller,
  refNo: "PO-4471",
  purpose: "Job work",
  purposeNote: null,
  status: "issued",
  lines: Array.from({ length: 9 }, (_, i) => ({
    description: `Raw forged blank for turning, EN8 grade, batch #${2000 + i}`,
    hsn: "7326",
    qty: 30 + i,
  })),
};

mkdirSync("src/fixtures", { recursive: true });
for (const [name, data] of [
  ["invoice-min", invoiceMin],
  ["invoice-max", invoiceMax],
  ["invoice-interstate", invoiceInterstate],
  ["dc-max", dcMax],
]) {
  writeFileSync(`src/fixtures/${name}.json`, JSON.stringify(data, null, 2) + "\n");
  console.log(`wrote src/fixtures/${name}.json`);
}
console.log("invoice-min total:", invoiceMin.total, "|", invoiceMin.amountInWords);
console.log("invoice-max total:", invoiceMax.total, "|", invoiceMax.amountInWords);
