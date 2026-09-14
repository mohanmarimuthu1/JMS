// GSTIN format: 2-digit state code, 10-char PAN, 1-digit entity code,
// literal 'Z', 1-char checksum. Mirrors the DB constraint in
// supabase/schema.sql — checked here too so the operator sees the
// error while typing, not only after the RPC rejects it.
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/;

export function isValidGstin(value: string): boolean {
  return GSTIN_RE.test(value.trim().toUpperCase());
}

export function gstinStateCode(value: string): string | null {
  const v = value.trim();
  return v.length >= 2 ? v.slice(0, 2) : null;
}

export const TAMIL_NADU_STATE_CODE = "33";

export function isOutOfState(gstin: string): boolean {
  const code = gstinStateCode(gstin);
  return !!code && code !== TAMIL_NADU_STATE_CODE;
}
