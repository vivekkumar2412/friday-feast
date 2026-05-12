import { useState } from "react";
import { useApp } from "../store";

interface Props {
  onClose: (billId?: string) => void;
}

export default function AddBillModal({ onClose }: Props) {
  const { addBill, restaurants } = useApp();
  const [restaurantName, setRestaurantName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleNameChange = (value: string) => {
    setRestaurantName(value);
    if (value.trim().length >= 2) {
      const q = value.toLowerCase();
      const matches = restaurants
        .filter((r) => r.name.toLowerCase().includes(q))
        .map((r) => r.name)
        .slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim() || !date) return;
    const bill = addBill(restaurantName.trim(), date, googleSheetUrl.trim() || undefined);
    onClose(bill.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-20 modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Bill</h2>
          <button onClick={() => onClose()} className="btn-ghost !p-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Restaurant Name *
            </label>
            <div className="relative">
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Cafe Juanita"
                value={restaurantName}
                onChange={(e) => handleNameChange(e.target.value)}
                autoFocus
                required
              />
              {suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setRestaurantName(s);
                        setSuggestions([]);
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-brand-50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date *
            </label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Google Sheet Link
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://docs.google.com/spreadsheets/..."
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400">Optional — link to a shared Google Sheet for this bill.</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => onClose()} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
