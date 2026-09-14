import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface CustomerRow {
  id: string;
  name: string;
  address: string | null;
  gstin: string | null;
}

export interface ItemRow {
  id: string;
  description: string;
  hsn: string | null;
  default_rate: number | null;
}

/**
 * Debounced, server-side, limited search — the prototype filtered the
 * entire in-memory customers/items array on every keystroke with no
 * debounce and no cap (billing-system.jsx:254-263). This queries
 * Supabase directly, 250ms after typing stops, capped at 6 results.
 */
function useDebouncedSearch<T>(
  query: string,
  search: (q: string) => Promise<T[]>,
  minLength = 2,
) {
  const [results, setResults] = useState<T[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < minLength) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const rows = await search(query.trim());
      setResults(rows);
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  return results;
}

export function useCustomerAutocomplete(query: string) {
  return useDebouncedSearch<CustomerRow>(query, async (q) => {
    const { data } = await supabase
      .from("customers")
      .select("id,name,address,gstin")
      .eq("is_active", true)
      .ilike("name", `%${q}%`)
      .order("name")
      .limit(6);
    return data ?? [];
  });
}

export function useItemAutocomplete(query: string) {
  return useDebouncedSearch<ItemRow>(query, async (q) => {
    const { data } = await supabase
      .from("items")
      .select("id,description,hsn,default_rate")
      .eq("is_active", true)
      .ilike("description", `%${q}%`)
      .order("description")
      .limit(6);
    return data ?? [];
  });
}
