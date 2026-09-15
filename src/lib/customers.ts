import { supabase } from "./supabase";

export interface CustomerListRow {
  id: string;
  name: string;
  address: string | null;
  gstin: string | null;
}

/** Server-side search over the customer master, same pattern as
 * fetchHistory (lib/history.ts) — not an in-memory filter. */
export async function fetchCustomers(query: string): Promise<CustomerListRow[]> {
  let q = supabase
    .from("customers")
    .select("id,name,address,gstin")
    .eq("is_active", true)
    .order("name")
    .limit(100);

  if (query.trim()) q = q.ilike("name", `%${query.trim()}%`);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchCustomer(id: string): Promise<CustomerListRow | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("id,name,address,gstin")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
