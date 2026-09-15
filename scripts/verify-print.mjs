// Automated print regression check (docs/PRINT.md). Complements, does
// NOT replace, the manual "print on the shop's printer and hold it
// next to the paper bill" test — this catches regressions a human
// would only notice by accident: no external network calls during
// print (fonts must be bundled, not fetched), no console errors, and
// that the A4 page count for a long invoice is actually > 1 (i.e. the
// @page + break-inside rules are doing something, not silently
// ignored).
import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE_URL ?? "http://localhost:4173";
const FIXTURES = ["invoice-min", "invoice-max", "invoice-interstate", "dc-max"];

function countPdfPages(buf) {
  // Cheap, dependency-free page count: every page object in a PDF
  // declares /Type /Page (not /Pages, the tree node) at least once.
  const text = buf.toString("latin1");
  const matches = text.match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 0;
}

async function main() {
  const browser = await chromium.launch();
  let failures = 0;
  const assert = (ok, msg) => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
    if (!ok) failures++;
  };

  for (const name of FIXTURES) {
    const page = await browser.newPage();
    const externalRequests = [];
    const consoleErrors = [];
    page.on("request", (req) => {
      const url = req.url();
      if (!url.startsWith(BASE) && !url.startsWith("data:")) {
        externalRequests.push(url);
      }
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));

    await page.goto(`${BASE}/print/fixture/${name}`, { waitUntil: "networkidle" });
    await page.waitForSelector("text=Print / Save PDF");

    assert(consoleErrors.length === 0, `${name}: no console errors (${consoleErrors.join("; ")})`);
    assert(
      externalRequests.length === 0,
      `${name}: zero external network requests during render (found: ${externalRequests.join(", ")})`,
    );

    await page.emulateMedia({ media: "print" });
    const pdf = await page.pdf({ printBackground: true });
    const pages = countPdfPages(pdf);
    console.log(`    ${name}: rendered ${pages} PDF page(s), ${pdf.length} bytes`);

    if (name === "invoice-max") {
      assert(pages > 1, `${name}: an 18-line invoice spans more than one A4 page`);
    } else {
      assert(pages === 1, `${name}: fits on a single A4 page`);
    }

    await page.close();
  }

  await browser.close();
  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll print checks passed.");
}

main();
