import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { PrintFixturePage } from "@/pages/PrintFixturePage";

/**
 * Print is a route, not a state swap (contrast with billing-system.jsx
 * :128-132, which replaced the whole app via `if (printInvoice) return
 * <PrintView/>`). Routing keeps the global stylesheet — and therefore
 * the fonts — mounted during print, and makes every document
 * reprintable from a bookmarkable URL. Real /print/invoice/:no and
 * /print/dc/:no routes are added in Slice 2/3 once documents exist in
 * the database; only the fixture route is needed for Slice 1.
 */
export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/print/fixture/:name", element: <PrintFixturePage /> },
]);
