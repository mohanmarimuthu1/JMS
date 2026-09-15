import { Link } from "react-router-dom";
import { FileText, Truck, Search, Building2, LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

/**
 * App shell. Customer/item/settings editors land in Slice 6
 * (deliberately deferred — the form already learns both on save).
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

      <div className="p-4 max-w-3xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-4">
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
        <Link
          to="/history"
          className="bg-white border border-rule rounded-sm p-6 flex flex-col items-center gap-2 hover:border-rust min-h-[120px] justify-center"
        >
          <Search size={28} />
          <span className="font-semibold">History</span>
        </Link>
        <Link
          to="/customers"
          className="bg-white border border-rule rounded-sm p-6 flex flex-col items-center gap-2 hover:border-rust min-h-[120px] justify-center"
        >
          <Building2 size={28} />
          <span className="font-semibold">Companies</span>
        </Link>
      </div>

      <div className="p-4 max-w-3xl mx-auto text-xs text-muted">
        Item lists and business-settings editors land in a later slice — see PROCESS.md.
      </div>
    </div>
  );
}
