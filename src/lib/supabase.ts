import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fails loudly at startup rather than making silent, unauthenticated
  // requests that RLS then denies with no explanation on screen — the
  // prototype's window.storage failure mode (swallowed exceptions,
  // total silent data loss) is exactly what this project isn't supposed
  // to repeat. See docs/DECISIONS.md.
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in.",
  );
}

export const supabase = createClient(url, anonKey);
