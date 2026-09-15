import { createBrowserRouter } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { NewInvoicePage } from "@/pages/NewInvoicePage";
import { NewDCPage } from "@/pages/NewDCPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { CustomerBillsPage } from "@/pages/CustomerBillsPage";
import { PrintFixturePage } from "@/pages/PrintFixturePage";
import { PrintDocumentPage } from "@/pages/PrintDocumentPage";
import { ProtectedRoute } from "@/lib/ProtectedRoute";

/**
 * Print is a route, not a state swap (contrast with billing-system.jsx
 * :128-132, which replaced the whole app via `if (printInvoice) return
 * <PrintView/>`). Routing keeps the global stylesheet — and therefore
 * the fonts — mounted during print, and makes every document
 * reprintable from a bookmarkable URL.
 *
 * Everything except /login and the fixture harness requires a
 * session — RLS denies an anonymous client anyway, but failing in the
 * UI first gives a clear "sign in" screen instead of a page full of
 * empty tables and silent errors.
 */
export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/print/fixture/:name", element: <PrintFixturePage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/new/invoice", element: <NewInvoicePage /> },
      { path: "/new/dc", element: <NewDCPage /> },
      { path: "/history", element: <HistoryPage /> },
      { path: "/customers", element: <CustomersPage /> },
      { path: "/customers/:id", element: <CustomerBillsPage /> },
      { path: "/print/invoice/:no", element: <PrintDocumentPage kind="invoice" /> },
      { path: "/print/dc/:no", element: <PrintDocumentPage kind="dc" /> },
    ],
  },
]);
