import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { saveDraft, loadDraft, clearDraft } from "@/lib/draft";
import { isValidGstin, isOutOfState, stripHonorificPrefix } from "@/lib/validation";
import { useCustomerAutocomplete, useItemAutocomplete, type ItemRow } from "@/hooks/useAutocomplete";
import type { FormConfig } from "./formConfigs";

interface DraftLine {
  key: string;
  description: string;
  hsn: string;
  qty: string;
  rate: string;
}

interface DraftState {
  customerId: string | null;
  customerName: string;
  customerAddress: string;
  customerGstin: string;
  date: string;
  orderNo: string;
  orderDate: string;
  refNo: string;
  purpose: string;
  purposeNote: string;
  lines: DraftLine[];
}

function emptyLine(): DraftLine {
  return { key: crypto.randomUUID(), description: "", hsn: "", qty: "", rate: "" };
}

function freshState(config: FormConfig): DraftState {
  return {
    customerId: null,
    customerName: "",
    customerAddress: "",
    customerGstin: "",
    date: new Date().toISOString().slice(0, 10),
    orderNo: "",
    orderDate: "",
    refNo: "",
    purpose: config.purposeOptions?.[0] ?? "",
    purposeNote: "",
    lines: [emptyLine()],
  };
}

export function DocumentForm({ config }: { config: FormConfig }) {
  const navigate = useNavigate();
  const [state, setState] = useState<DraftState>(() => loadDraft<DraftState>(config.draftStorageKey) ?? freshState(config));
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [customerQuery, setCustomerQuery] = useState(state.customerName);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const customerResults = useCustomerAutocomplete(state.customerId ? "" : customerQuery);

  // "Last bill issued: N" — a fact, never a promise. Replaces the
  // prototype's `No. {counter + 1}` preview, which cannot be truthful
  // against a real DB sequence (docs/DECISIONS.md #5f).
  useEffect(() => {
    supabase
      .from(config.numberTable)
      .select(config.numberColumn)
      .order(config.numberColumn, { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const row = data?.[0] as Record<string, number> | undefined;
        setLastNumber(row ? row[config.numberColumn] : null);
      });
  }, [config.numberTable, config.numberColumn]);

  // Draft autosave — debounced 400ms so typing doesn't thrash localStorage.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDraft(config.draftStorageKey, state), 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, config.draftStorageKey]);

  function update<K extends keyof DraftState>(key: K, value: DraftState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function pickCustomer(c: { id: string; name: string; address: string | null; gstin: string | null }) {
    setState((s) => ({ ...s, customerId: c.id, customerName: c.name, customerAddress: c.address ?? "", customerGstin: c.gstin ?? "" }));
    setCustomerQuery(c.name);
    setShowCustomerList(false);
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setState((s) => ({ ...s, lines: s.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  }
  function pickItemForLine(key: string, item: ItemRow) {
    updateLine(key, {
      description: item.description,
      hsn: item.hsn ?? "",
      rate: config.hasRate && item.default_rate != null ? String(item.default_rate) : "",
    });
  }
  function addLine() {
    if (state.lines.length >= config.maxLines) return;
    setState((s) => ({ ...s, lines: [...s.lines, emptyLine()] }));
  }
  function removeLine(key: string) {
    setState((s) => (s.lines.length <= 1 ? s : { ...s, lines: s.lines.filter((l) => l.key !== key) }));
  }
  function resetForm() {
    setState(freshState(config));
    setCustomerQuery("");
    clearDraft(config.draftStorageKey);
  }

  const gstinInvalid = state.customerGstin.trim() !== "" && !isValidGstin(state.customerGstin);
  const outOfState = state.customerGstin.trim() !== "" && !gstinInvalid && isOutOfState(state.customerGstin);
  const validLines = state.lines.filter((l) => l.description.trim() && parseFloat(l.qty) > 0);
  const canSubmit = state.customerName.trim() !== "" && validLines.length > 0 && !gstinInvalid;

  async function handleSubmit() {
    setError(null);
    if (!state.customerName.trim()) { setError("Add a customer name first."); return; }
    if (validLines.length === 0) { setError("Add at least one line with a description and quantity."); return; }
    if (gstinInvalid) { setError("Customer GSTIN doesn't look right — check the format."); return; }

    setSubmitting(true);
    const payload: Record<string, unknown> = {
      date: state.date,
      customer_id: state.customerId,
      customer: { name: state.customerName, address: state.customerAddress, gstin: state.customerGstin || null },
      lines: validLines.map((l) => ({ description: l.description, hsn: l.hsn, qty: l.qty, rate: l.rate })),
    };
    if (config.kind === "invoice") {
      payload.order_no = state.orderNo;
      payload.order_date = state.orderDate;
    } else {
      payload.ref_no = state.refNo;
      payload.purpose = state.purpose;
      payload.purpose_note = state.purposeNote;
    }

    const { data, error: rpcError } = await supabase.rpc(config.rpc, { payload });
    setSubmitting(false);

    if (rpcError) {
      // Never fail silently — the prototype's window.storage failures
      // (billing-system.jsx:22,30) looked successful while persisting
      // nothing. The form stays filled so nothing typed is lost.
      setError(rpcError.message);
      return;
    }

    const no = data?.[0]?.[config.numberColumn];
    clearDraft(config.draftStorageKey);
    navigate(`/print/${config.kind}/${no}`);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4 mono">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold headline">{config.title}</h1>
        <div className="text-sm text-muted">
          {lastNumber != null ? `Last bill issued: ${lastNumber}` : "—"}
          {" · "}No. — assigned on save
        </div>
      </div>

      {/* Customer */}
      <div className="bg-white border border-rule rounded-sm p-4 grid sm:grid-cols-2 gap-4">
        <div className="relative sm:col-span-2">
          <label className="block text-sm mb-1">Company name</label>
          <div className="relative">
            <input
              value={customerQuery}
              onChange={(e) => {
                // Honorifics stripped as you type ("Mr Ganesan" ->
                // "Ganesan") — a business tax invoice shouldn't carry a
                // salutation, whether it was typed out of habit or
                // inserted by the browser's own autofill (see the
                // autoComplete="off" note below).
                const value = stripHonorificPrefix(e.target.value);
                setCustomerQuery(value);
                update("customerId", null);
                update("customerName", value);
                setShowCustomerList(true);
              }}
              onFocus={() => setShowCustomerList(true)}
              onBlur={() => setTimeout(() => setShowCustomerList(false), 150)}
              className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px]"
              placeholder="Type to search or add new"
              autoComplete="off"
              name="jms-customer-name"
            />
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
          </div>
          {showCustomerList && customerResults.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-rule rounded-sm mt-1 max-h-48 overflow-auto shadow-sm">
              {customerResults.map((c) => (
                <li
                  key={c.id}
                  className="px-3 py-2 hover:bg-paper cursor-pointer text-sm"
                  // Blocks the input's blur (which the onBlur above would
                  // otherwise race against this click and hide the list
                  // before it registers) instead of letting focus leave first.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickCustomer(c)}
                >
                  <div className="font-medium">{c.name}</div>
                  {c.address && <div className="text-muted text-xs">{c.address}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="block text-sm mb-1">Address</label>
          <input
            value={state.customerAddress}
            onChange={(e) => update("customerAddress", e.target.value)}
            className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px]"
            autoComplete="off"
            name="jms-customer-address"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">GSTIN</label>
          <input
            value={state.customerGstin}
            onChange={(e) => update("customerGstin", e.target.value.toUpperCase())}
            className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px] uppercase"
            autoComplete="off"
            name="jms-customer-gstin"
          />
          {gstinInvalid && <p className="text-xs text-rust mt-1">Doesn't look like a valid 15-character GSTIN.</p>}
          {outOfState && (
            <p className="text-xs text-muted mt-1">
              Out-of-state GSTIN — this bill will use IGST instead of SGST + CGST.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Date</label>
          <input
            type="date"
            value={state.date}
            onChange={(e) => update("date", e.target.value)}
            className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px]"
          />
        </div>

        {config.kind === "invoice" ? (
          <>
            <div>
              <label className="block text-sm mb-1">Order No.</label>
              <input
                value={state.orderNo}
                onChange={(e) => update("orderNo", e.target.value)}
                className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Order Date</label>
              <input
                type="date"
                value={state.orderDate}
                onChange={(e) => update("orderDate", e.target.value)}
                className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px]"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm mb-1">Ref / Order No.</label>
              <input
                value={state.refNo}
                onChange={(e) => update("refNo", e.target.value)}
                className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Purpose</label>
              <select
                value={state.purpose}
                onChange={(e) => update("purpose", e.target.value)}
                className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px]"
              >
                {config.purposeOptions!.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            {state.purpose === "Other" && (
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1">Note (required for "Other")</label>
                <input
                  value={state.purposeNote}
                  onChange={(e) => update("purposeNote", e.target.value)}
                  className="w-full border border-rule rounded-sm px-3 py-2 min-h-[44px]"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Line items */}
      <div className="bg-white border border-rule rounded-sm p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-semibold">Line items</h2>
          <span className="text-xs text-muted">{state.lines.length}/{config.maxLines}</span>
        </div>

        {/* Desktop/tablet: table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-rule">
                <th className="py-1 pr-2">Description</th>
                <th className="py-1 pr-2 w-24">HSN</th>
                <th className="py-1 pr-2 w-20">Qty</th>
                {config.hasRate && <th className="py-1 pr-2 w-24">Rate</th>}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {state.lines.map((line) => (
                <LineRow key={line.key} line={line} config={config} onUpdate={updateLine} onPickItem={pickItemForLine} onRemove={removeLine} canRemove={state.lines.length > 1} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked cards — the prototype's plain <table> with 7
            live input columns and no overflow wrapper was unusable on a
            phone, the operator's primary device (docs/DECISIONS.md). */}
        <div className="sm:hidden space-y-3">
          {state.lines.map((line, idx) => (
            <div key={line.key} className="border border-rule rounded-sm p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Line {idx + 1}</span>
                {state.lines.length > 1 && (
                  <button onClick={() => removeLine(line.key)} className="p-2 text-rust" aria-label="Remove line">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <LineItemInputs line={line} config={config} onUpdate={updateLine} onPickItem={pickItemForLine} />
            </div>
          ))}
        </div>

        <button
          onClick={addLine}
          disabled={state.lines.length >= config.maxLines}
          className="mt-3 flex items-center gap-1.5 text-sm px-3 py-2 min-h-[44px] border border-rule rounded-sm disabled:opacity-50"
        >
          <Plus size={15} /> Add line
        </button>
      </div>

      {error && (
        <div className="text-sm text-rust border border-rust/60 bg-rust/5 rounded-sm p-3">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="min-h-[44px] px-6 bg-rust text-white rounded-sm disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save & Print"}
        </button>
        <button onClick={resetForm} className="min-h-[44px] px-4 border border-rule rounded-sm">
          Clear
        </button>
      </div>
    </div>
  );
}

function LineRow({
  line, config, onUpdate, onPickItem, onRemove, canRemove,
}: {
  line: DraftLine;
  config: FormConfig;
  onUpdate: (key: string, patch: Partial<DraftLine>) => void;
  onPickItem: (key: string, item: ItemRow) => void;
  onRemove: (key: string) => void;
  canRemove: boolean;
}) {
  return (
    <tr className="border-b border-rule/60 align-top">
      <td className="py-1.5 pr-2">
        <DescriptionCell line={line} onUpdate={onUpdate} onPickItem={onPickItem} />
      </td>
      <td className="py-1.5 pr-2">
        <input value={line.hsn} onChange={(e) => onUpdate(line.key, { hsn: e.target.value })} className="w-full border border-rule rounded-sm px-2 py-1.5 min-h-[40px]" />
      </td>
      <td className="py-1.5 pr-2">
        <input value={line.qty} onChange={(e) => onUpdate(line.key, { qty: e.target.value })} inputMode="decimal" className="w-full border border-rule rounded-sm px-2 py-1.5 min-h-[40px]" />
      </td>
      {config.hasRate && (
        <td className="py-1.5 pr-2">
          <input value={line.rate} onChange={(e) => onUpdate(line.key, { rate: e.target.value })} inputMode="decimal" className="w-full border border-rule rounded-sm px-2 py-1.5 min-h-[40px]" />
        </td>
      )}
      <td className="py-1.5">
        {canRemove && (
          <button onClick={() => onRemove(line.key)} className="p-2 text-rust" aria-label="Remove line">
            <Trash2 size={15} />
          </button>
        )}
      </td>
    </tr>
  );
}

function LineItemInputs({
  line, config, onUpdate, onPickItem,
}: {
  line: DraftLine;
  config: FormConfig;
  onUpdate: (key: string, patch: Partial<DraftLine>) => void;
  onPickItem: (key: string, item: ItemRow) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-2">
        <DescriptionCell line={line} onUpdate={onUpdate} onPickItem={onPickItem} />
      </div>
      <input placeholder="HSN" value={line.hsn} onChange={(e) => onUpdate(line.key, { hsn: e.target.value })} className="border border-rule rounded-sm px-2 py-2 min-h-[44px]" />
      <input placeholder="Qty" value={line.qty} onChange={(e) => onUpdate(line.key, { qty: e.target.value })} inputMode="decimal" className="border border-rule rounded-sm px-2 py-2 min-h-[44px]" />
      {config.hasRate && (
        <input placeholder="Rate" value={line.rate} onChange={(e) => onUpdate(line.key, { rate: e.target.value })} inputMode="decimal" className="col-span-2 border border-rule rounded-sm px-2 py-2 min-h-[44px]" />
      )}
    </div>
  );
}

function DescriptionCell({
  line, onUpdate, onPickItem,
}: {
  line: DraftLine;
  onUpdate: (key: string, patch: Partial<DraftLine>) => void;
  onPickItem: (key: string, item: ItemRow) => void;
}) {
  const [showList, setShowList] = useState(false);
  const results = useItemAutocomplete(line.description);
  return (
    <div className="relative">
      <input
        value={line.description}
        onChange={(e) => { onUpdate(line.key, { description: e.target.value }); setShowList(true); }}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
        placeholder="Description"
        className="w-full border border-rule rounded-sm px-2 py-1.5 min-h-[40px]"
        autoComplete="off"
        name="jms-line-description"
      />
      {showList && results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-rule rounded-sm mt-1 max-h-40 overflow-auto shadow-sm text-sm">
          {results
            .filter((it) => it.description.toLowerCase() !== line.description.trim().toLowerCase())
            .map((it) => (
              <li
                key={it.id}
                className="px-2 py-1.5 hover:bg-paper cursor-pointer"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickItem(line.key, it)}
              >
                {it.description}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
