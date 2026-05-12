import { useState, useMemo, useCallback, useRef } from "react";
import { useApp } from "../store";
import { BILL_FAMILIES } from "../types";
import type { Bill, BillFamily, BillRow } from "../types";
import AddBillModal from "./AddBillModal";
import ConfirmDialog from "./ConfirmDialog";

const emptyAmounts = () =>
  Object.fromEntries(BILL_FAMILIES.map((f) => [f, 0])) as Record<BillFamily, number>;

function billTotal(bill: Bill): number {
  const taxObj = bill.tax || emptyAmounts();
  const tipObj = bill.tip || emptyAmounts();
  const sub = bill.rows.reduce((s, r) => s + Object.values(r.amounts).reduce((a, b) => a + b, 0), 0);
  return sub + Object.values(taxObj).reduce((a, b) => a + b, 0) + Object.values(tipObj).reduce((a, b) => a + b, 0);
}

function parseCSV(text: string): BillRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const headerLine = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const familyIndices: Record<string, number> = {};
  BILL_FAMILIES.forEach((f) => {
    const idx = headerLine.findIndex((h) => h.includes(f.toLowerCase()));
    if (idx >= 0) familyIndices[f] = idx;
  });

  const itemIdx = headerLine.findIndex((h) => h === "item" || h === "items" || h === "description");
  const rows: BillRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const item = itemIdx >= 0 ? cols[itemIdx] || "" : cols[0] || "";
    const amounts = {} as Record<BillFamily, number>;
    BILL_FAMILIES.forEach((f) => {
      const idx = familyIndices[f];
      amounts[f] = idx !== undefined ? parseFloat(cols[idx]) || 0 : 0;
    });
    rows.push({ item, amounts });
  }
  return rows;
}

export default function BillPayView() {
  const { bills, deleteBill, updateBill } = useApp();
  const [showAddBill, setShowAddBill] = useState(false);
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const billToDelete = confirmDeleteId ? bills.find((b) => b.id === confirmDeleteId) : null;
  const activeBill = activeBillId ? bills.find((b) => b.id === activeBillId) : null;

  const handleUploadClick = (e: React.MouseEvent, billId: string) => {
    e.stopPropagation();
    setUploadTargetId(billId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const rows = parseCSV(text);
      if (rows.length > 0) {
        const bill = bills.find((b) => b.id === uploadTargetId);
        if (bill) {
          updateBill({ ...bill, rows });
          setActiveBillId(bill.id);
        }
      }
      setUploadTargetId(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return bills;
    const q = search.toLowerCase();
    return bills.filter(
      (b) =>
        b.restaurantName.toLowerCase().includes(q) ||
        b.createdBy.toLowerCase().includes(q) ||
        new Date(b.date).toLocaleDateString().includes(q)
    );
  }, [bills, search]);

  const handleAddClose = (billId?: string) => {
    setShowAddBill(false);
    if (billId) setActiveBillId(billId);
  };

  if (activeBill) {
    return <BillTable bill={activeBill} onBack={() => setActiveBillId(null)} />;
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Bill Pay</h2>
          <p className="text-sm text-gray-500">Split the bill after every Friday Feast outing.</p>
        </div>
        <button onClick={() => setShowAddBill(true)} className="btn-primary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Bill
        </button>
      </div>

      {/* Search + View toggle */}
      {bills.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search bills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex rounded-xl border-2 border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-2 transition-colors ${viewMode === "cards" ? "bg-brand-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              title="Card view"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 transition-colors ${viewMode === "list" ? "bg-brand-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              title="List view"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 && bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="mb-3 text-5xl">🧾</span>
          <p className="text-lg font-semibold text-gray-900">No bills yet</p>
          <p className="text-gray-500">After your next Friday Feast, click "Add Bill" to create a split sheet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-gray-900">No bills match your search</p>
          <p className="text-gray-500">Try a different search term.</p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((bill) => {
            const total = billTotal(bill);
            return (
              <div
                key={bill.id}
                className="card group animate-fade-in cursor-pointer hover:ring-2 hover:ring-brand-200"
                onClick={() => setActiveBillId(bill.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{bill.restaurantName}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(bill.date).toLocaleDateString("en-US", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(bill.id); }}
                    className="opacity-0 group-hover:opacity-100 btn-ghost !p-1.5 !rounded-lg text-gray-400 hover:text-red-500 transition-all"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
                {total > 0 && <p className="mt-2 text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>}
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <button
                    onClick={(e) => handleUploadClick(e, bill.id)}
                    className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Upload CSV
                  </button>
                  {bill.googleSheetUrl && (
                    <a
                      href={bill.googleSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      Google Sheet
                    </a>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                  <span>Created by {bill.createdBy}</span>
                  <span className="font-semibold text-brand-600">
                    {bill.rows.filter((r) => r.item.trim()).length} items
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="hidden sm:grid sm:grid-cols-[1fr_120px_100px_80px_140px_60px] gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span>Restaurant</span>
            <span>Date</span>
            <span className="text-right">Total</span>
            <span className="text-right">Items</span>
            <span>Links</span>
            <span></span>
          </div>
          {filtered.map((bill, i) => {
            const total = billTotal(bill);
            return (
              <div
                key={bill.id}
                onClick={() => setActiveBillId(bill.id)}
                className={`group grid sm:grid-cols-[1fr_120px_100px_80px_140px_60px] gap-2 px-4 py-3 cursor-pointer transition-colors hover:bg-brand-50 ${
                  i !== filtered.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="min-w-0">
                  <span className="font-semibold text-gray-900 truncate">{bill.restaurantName}</span>
                  <p className="text-xs text-gray-400">by {bill.createdBy}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">{new Date(bill.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-end">
                  <span className="text-sm font-bold text-gray-900">{total > 0 ? `$${total.toFixed(2)}` : "—"}</span>
                </div>
                <div className="flex items-center justify-end">
                  <span className="text-sm text-gray-500">{bill.rows.filter((r) => r.item.trim()).length}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={(e) => handleUploadClick(e, bill.id)}
                    className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
                    title="Upload CSV"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </button>
                  {bill.googleSheetUrl && (
                    <a
                      href={bill.googleSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-green-600 hover:text-green-700 font-medium transition-colors"
                      title="Google Sheet"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(bill.id); }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddBill && <AddBillModal onClose={handleAddClose} />}

      {billToDelete && (
        <ConfirmDialog
          message={`Are you sure you want to delete the bill for ${billToDelete.restaurantName}?`}
          onConfirm={() => { deleteBill(billToDelete.id); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

function BillTable({ bill, onBack }: { bill: Bill; onBack: () => void }) {
  const { updateBill } = useApp();
  const [restaurantName, setRestaurantName] = useState(bill.restaurantName);
  const [date, setDate] = useState(bill.date);
  const [rows, setRows] = useState<BillRow[]>(bill.rows);
  const [tax, setTax] = useState<Record<BillFamily, number>>(
    bill.tax && typeof bill.tax === "object" ? bill.tax : emptyAmounts()
  );
  const [tip, setTip] = useState<Record<BillFamily, number>>(
    bill.tip && typeof bill.tip === "object" ? bill.tip : emptyAmounts()
  );

  const save = useCallback(
    (r: BillRow[], t: Record<BillFamily, number>, tp: Record<BillFamily, number>, rn?: string, d?: string) => {
      updateBill({ ...bill, rows: r, tax: t, tip: tp, restaurantName: rn ?? restaurantName, date: d ?? date });
    },
    [bill, updateBill, restaurantName, date]
  );

  const handleNameChange = (v: string) => {
    setRestaurantName(v);
    save(rows, tax, tip, v, date);
  };

  const handleDateChange = (v: string) => {
    setDate(v);
    save(rows, tax, tip, restaurantName, v);
  };

  const updateRow = useCallback(
    (idx: number, field: "item" | BillFamily, value: string) => {
      setRows((prev) => {
        const next = prev.map((r, i) => {
          if (i !== idx) return r;
          if (field === "item") return { ...r, item: value };
          return { ...r, amounts: { ...r.amounts, [field]: parseFloat(value) || 0 } };
        });
        save(next, tax, tip);
        return next;
      });
    },
    [save, tax, tip]
  );

  const addRow = useCallback(() => {
    const newRow: BillRow = { item: "", amounts: emptyAmounts() };
    setRows((prev) => { const next = [...prev, newRow]; save(next, tax, tip); return next; });
  }, [save, tax, tip]);

  const removeRow = useCallback(
    (idx: number) => {
      setRows((prev) => { const next = prev.filter((_, i) => i !== idx); save(next, tax, tip); return next; });
    },
    [save, tax, tip]
  );

  const updateTax = useCallback(
    (family: BillFamily, value: string) => {
      setTax((prev) => { const next = { ...prev, [family]: parseFloat(value) || 0 }; save(rows, next, tip); return next; });
    },
    [save, rows, tip]
  );

  const updateTip = useCallback(
    (family: BillFamily, value: string) => {
      setTip((prev) => { const next = { ...prev, [family]: parseFloat(value) || 0 }; save(rows, tax, next); return next; });
    },
    [save, rows, tax]
  );

  const rowTotal = (row: BillRow) => Object.values(row.amounts).reduce((a, b) => a + b, 0);

  const colTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const f of BILL_FAMILIES) totals[f] = rows.reduce((sum, row) => sum + (row.amounts[f] || 0), 0);
    return totals;
  }, [rows]);

  const subtotal = useMemo(() => rows.reduce((sum, row) => sum + rowTotal(row), 0), [rows]);
  const totalTax = useMemo(() => Object.values(tax).reduce((a, b) => a + b, 0), [tax]);
  const totalTip = useMemo(() => Object.values(tip).reduce((a, b) => a + b, 0), [tip]);
  const grandTotal = subtotal + totalTax + totalTip;

  const familyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const f of BILL_FAMILIES) totals[f] = (colTotals[f] || 0) + (tax[f] || 0) + (tip[f] || 0);
    return totals;
  }, [colTotals, tax, tip]);

  const numInputClass =
    "w-full rounded-lg border-0 bg-transparent px-2 py-1.5 text-right text-sm text-gray-800 placeholder-gray-300 focus:bg-white focus:ring-2 focus:ring-brand-300 transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  const footInputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-right text-sm font-medium text-gray-800 focus:ring-2 focus:ring-brand-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button onClick={onBack} className="btn-ghost !p-2 !rounded-lg flex-shrink-0">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1 flex flex-wrap items-center gap-3">
          <input
            type="text"
            className="rounded-xl border-2 border-transparent bg-transparent px-2 py-1 text-lg font-bold text-gray-900 hover:border-gray-200 focus:border-brand-400 focus:bg-white focus:outline-none transition-colors"
            value={restaurantName}
            onChange={(e) => handleNameChange(e.target.value)}
          />
          <input
            type="date"
            className="rounded-xl border-2 border-transparent bg-transparent px-2 py-1 text-sm text-gray-500 hover:border-gray-200 focus:border-brand-400 focus:bg-white focus:outline-none transition-colors"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
          />
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm text-gray-500">Grand Total</p>
          <p className="text-2xl font-bold text-gray-900">${grandTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600 w-48">Item</th>
              {BILL_FAMILIES.map((f) => (
                <th key={f} className="px-3 py-2.5 text-right font-semibold text-gray-600 w-24">{f}</th>
              ))}
              <th className="px-3 py-2.5 text-right font-semibold text-gray-900 w-24">Row Total</th>
              <th className="px-2 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50 group">
                <td className="px-1 py-1">
                  <input
                    type="text"
                    className="w-full rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm text-gray-800 placeholder-gray-300 focus:bg-white focus:ring-2 focus:ring-brand-300 transition-all"
                    placeholder="Item name..."
                    value={row.item}
                    onChange={(e) => updateRow(idx, "item", e.target.value)}
                  />
                </td>
                {BILL_FAMILIES.map((f) => (
                  <td key={f} className="px-1 py-1">
                    <input
                      type="number" step="0.01" min="0"
                      className={numInputClass}
                      placeholder="0"
                      value={row.amounts[f] || ""}
                      onChange={(e) => updateRow(idx, f, e.target.value)}
                    />
                  </td>
                ))}
                <td className="px-3 py-1.5 text-right font-medium text-gray-900 tabular-nums">
                  ${rowTotal(row).toFixed(2)}
                </td>
                <td className="px-1 py-1.5">
                  <button
                    onClick={() => removeRow(idx)}
                    className="opacity-0 group-hover:opacity-100 rounded p-1 text-gray-300 hover:text-red-500 transition-all"
                    title="Remove row"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {/* Subtotal */}
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-3 py-2 font-semibold text-gray-700">Subtotal</td>
              {BILL_FAMILIES.map((f) => (
                <td key={f} className="px-3 py-2 text-right font-semibold text-gray-700 tabular-nums">
                  ${(colTotals[f] || 0).toFixed(2)}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-bold text-gray-900 tabular-nums">${subtotal.toFixed(2)}</td>
              <td></td>
            </tr>
            {/* Tax per family */}
            <tr className="bg-gray-50">
              <td className="px-3 py-1.5 text-gray-600">Tax</td>
              {BILL_FAMILIES.map((f) => (
                <td key={f} className="px-1 py-1">
                  <input
                    type="number" step="0.01" min="0"
                    className={footInputClass}
                    placeholder="0"
                    value={tax[f] || ""}
                    onChange={(e) => updateTax(f, e.target.value)}
                  />
                </td>
              ))}
              <td className="px-3 py-1.5 text-right font-medium text-gray-700 tabular-nums">${totalTax.toFixed(2)}</td>
              <td></td>
            </tr>
            {/* Tip per family */}
            <tr className="bg-gray-50">
              <td className="px-3 py-1.5 text-gray-600">Tip</td>
              {BILL_FAMILIES.map((f) => (
                <td key={f} className="px-1 py-1">
                  <input
                    type="number" step="0.01" min="0"
                    className={footInputClass}
                    placeholder="0"
                    value={tip[f] || ""}
                    onChange={(e) => updateTip(f, e.target.value)}
                  />
                </td>
              ))}
              <td className="px-3 py-1.5 text-right font-medium text-gray-700 tabular-nums">${totalTip.toFixed(2)}</td>
              <td></td>
            </tr>
            {/* Grand Total */}
            <tr className="border-t-2 border-gray-300 bg-brand-50">
              <td className="px-3 py-2.5 font-bold text-gray-900">Total</td>
              {BILL_FAMILIES.map((f) => (
                <td key={f} className="px-3 py-2.5 text-right font-bold text-brand-700 tabular-nums">
                  ${(familyTotals[f] || 0).toFixed(2)}
                </td>
              ))}
              <td className="px-3 py-2.5 text-right font-bold text-brand-700 text-base tabular-nums">
                ${grandTotal.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add row & Save */}
      <div className="mt-3 flex items-center justify-between">
        <button onClick={addRow} className="btn-ghost text-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Row
        </button>
        <button onClick={onBack} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Save
        </button>
      </div>
    </div>
  );
}
