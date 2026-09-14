/**
 * localStorage draft autosave (Slice 3 decision: "never lose typed
 * work" — docs/DECISIONS.md). A dropped connection or a killed tab
 * mid-invoice should never mean retyping a 12-line bill.
 */
export function saveDraft<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable (private browsing) — the form still
    // works, it just can't autosave. Not fatal, unlike the prototype's
    // window.storage failures, which silently dropped *saved* data.
  }
}

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
