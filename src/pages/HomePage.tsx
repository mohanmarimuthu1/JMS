import { Link } from "react-router-dom";
import { FileText, Truck, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

/**
 * App shell for Slice 3. History/Customers/Items/Settings tabs land
 * in Slices 5/6 — this is deliberately just the two things a real
 * bill requires today: make an invoice, make a DC.
 */
export function HomePage() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-paper mono text-ink">
      <header className="bg-ink text-white px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold headline">JMS Engineering</h1>
        <button onClick={signOut} className="flex items-center gap-1.5 text-sm opacity-90 hover:opacity-100">
          <LogOut size={15} /> Sign out
        </button>
      </header>

      <div className="p-4 max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
        <Link
          to="/new/invoice"
          className="bg-white border border-rule rounded-sm p-6 flex flex-col items-center gap-2 hover:border-rust min-h-[120px] justify-center"
        >
          <FileText size={28} />
          <span className="font-semibold">New Invoice</span>
        </Link>
        <Link
          to="/new/dc"
          className="bg-white border border-rule rounded-sm p-6 flex flex-col items-center gap-2 hover:border-rust min-h-[120px] justify-center"
        >
          <Truck size={28} />
          <span className="font-semibold">New Delivery Challan</span>
        </Link>
      </div>

      <div className="p-4 max-w-3xl mx-auto text-xs text-muted">
        History, customer/item lists, and settings editors land in later slices — see PROCESS.md.
      </div>
    </div>
  );
}
