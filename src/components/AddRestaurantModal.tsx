import { useState, useCallback } from "react";
import { useApp } from "../store";
import { CUISINES, NEIGHBORHOODS, type CuisineType } from "../types";
import type { Restaurant } from "../types";
import ConfirmDialog from "./ConfirmDialog";
import { parseGoogleMapsLink } from "../utils/parseGoogleMapsUrl";

interface Props {
  onClose: () => void;
  editRestaurant?: Restaurant | null;
}

export default function AddRestaurantModal({ onClose, editRestaurant }: Props) {
  const { addRestaurant, updateRestaurant, username, restaurants } = useApp();
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState("");

  const [name, setName] = useState(editRestaurant?.name ?? "");
  const [googleMapsUrl, setGoogleMapsUrl] = useState(editRestaurant?.googleMapsUrl ?? "");
  const [cuisine, setCuisine] = useState<string>(editRestaurant?.cuisine ?? "");
  const [neighborhood, setNeighborhood] = useState(editRestaurant?.neighborhood ?? "");
  const [address, setAddress] = useState(editRestaurant?.address ?? "");
  const [priceRange, setPriceRange] = useState<1 | 2 | 3 | 4>(
    editRestaurant?.priceRange ?? 2
  );
  const [notes, setNotes] = useState(editRestaurant?.notes ?? "");
  const [menuUrl, setMenuUrl] = useState(editRestaurant?.menuUrl ?? "");
  const [googleRating, setGoogleRating] = useState(
    editRestaurant?.googleRating?.toString() ?? ""
  );
  const [latitude, setLatitude] = useState<number | undefined>(editRestaurant?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(editRestaurant?.longitude);

  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<string>("");

  const handleMapsUrlChange = useCallback(async (url: string) => {
    setGoogleMapsUrl(url);

    if (!url.trim() || (!url.includes("google.com/maps") && !url.includes("goo.gl"))) {
      setParseStatus("");
      return;
    }

    setParsing(true);
    setParseStatus("Fetching restaurant details...");

    try {
      const data = await parseGoogleMapsLink(url);
      const populated: string[] = [];

      if (data.placeName && !name) {
        setName(data.placeName);
        populated.push("name");
      }
      if (data.latitude != null) setLatitude(data.latitude);
      if (data.longitude != null) setLongitude(data.longitude);
      if (data.address) {
        setAddress(data.address);
        populated.push("address");
      }
      if (data.neighborhood && data.neighborhood !== "Other") {
        setNeighborhood(data.neighborhood);
        populated.push("neighborhood");
      }
      if (data.cuisine) {
        setCuisine(data.cuisine);
        populated.push("cuisine");
      }
      if (data.googleRating) {
        setGoogleRating(data.googleRating.toString());
        populated.push("rating");
      }
      if (data.menuUrl) {
        setMenuUrl(data.menuUrl);
        populated.push("menu");
      }
      if (data.notes && !notes) {
        setNotes(data.notes);
        populated.push("description");
      }

      setParseStatus(
        populated.length > 0
          ? `Auto-populated: ${populated.join(", ")}`
          : "Link saved — fill in remaining details manually"
      );
    } catch {
      setParseStatus("Could not auto-populate — please fill in manually");
    } finally {
      setParsing(false);
    }
  }, [name, notes]);

  const buildData = () => ({
    name: name.trim(),
    cuisine: cuisine || "Other",
    neighborhood: neighborhood || "Other",
    address: address.trim(),
    priceRange,
    notes: notes.trim(),
    addedBy: username,
    googleMapsUrl: googleMapsUrl.trim(),
    menuUrl: menuUrl.trim() || undefined,
    googleRating: googleRating ? parseFloat(googleRating) : undefined,
    latitude,
    longitude,
  });

  const submitRestaurant = () => {
    const data = buildData();
    if (editRestaurant) {
      updateRestaurant({ ...editRestaurant, ...data });
    } else {
      addRestaurant(data);
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !googleMapsUrl.trim() || !address.trim() || !cuisine || !googleRating) return;

    if (!editRestaurant) {
      const newName = name.trim().toLowerCase();
      const duplicate = restaurants.find((r) => {
        const existing = r.name.toLowerCase();
        return existing === newName || existing.includes(newName) || newName.includes(existing);
      });
      if (duplicate) {
        setDuplicateMatch(duplicate.name);
        setShowDuplicateConfirm(true);
        return;
      }
    }

    submitRestaurant();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-20 modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {editRestaurant ? "Edit Restaurant" : "Add a Restaurant"}
          </h2>
          <button onClick={onClose} className="btn-ghost !p-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Restaurant Name *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Sushi Palace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Google Maps Link */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Google Maps Link *
            </label>
            <div className="relative">
              <input
                type="url"
                className="input-field pr-10"
                placeholder="Paste Google Maps share link..."
                value={googleMapsUrl}
                onChange={(e) => handleMapsUrlChange(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (pasted) {
                    e.preventDefault();
                    setGoogleMapsUrl(pasted);
                    handleMapsUrlChange(pasted);
                  }
                }}
                required
              />
              {parsing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>
            {parseStatus && (
              <p className={`mt-1 text-xs ${parseStatus.includes("Auto-populated") ? "text-green-600" : "text-gray-400"}`}>
                {parseStatus}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Tip: Open the restaurant on Google Maps, click Share → Copy link, and paste here. Use the full URL for best auto-populate results.
            </p>
          </div>

          {/* Cuisine & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cuisine *
                {cuisine && parseStatus.includes("cuisine") && (
                  <span className="ml-2 text-xs font-normal text-green-600">auto</span>
                )}
              </label>
              <select
                className="input-field"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                required
              >
                <option value="">Select...</option>
                {CUISINES.filter((c) => c !== "All").map((c: CuisineType) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Price Range
              </label>
              <div className="flex gap-1">
                {([1, 2, 3, 4] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriceRange(p)}
                    className={`flex-1 rounded-lg border-2 py-2 text-sm font-bold transition-colors ${
                      priceRange === p
                        ? "border-brand-400 bg-brand-50 text-brand-700"
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    {"$".repeat(p)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Neighborhood */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Neighborhood
              {neighborhood && parseStatus.includes("neighborhood") && (
                <span className="ml-2 text-xs font-normal text-green-600">auto-populated</span>
              )}
            </label>
            <select
              className="input-field"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
            >
              <option value="">Select...</option>
              {NEIGHBORHOODS.filter((n) => n !== "All").map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Address *
              {address && parseStatus.includes("address") && (
                <span className="ml-2 text-xs font-normal text-green-600">auto-populated</span>
              )}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="123 Main St, City"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          {/* Google Rating & Menu Link */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Google Rating *{" "}
                <span className="font-normal text-gray-400">(1.0–5.0)</span>
                {googleRating && parseStatus.includes("rating") && (
                  <span className="ml-1 text-xs font-normal text-green-600">auto</span>
                )}
              </label>
              <input
                type="number"
                min="1"
                max="5"
                step="0.1"
                className="input-field"
                placeholder="e.g. 4.5"
                value={googleRating}
                onChange={(e) => setGoogleRating(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Menu Link
                {menuUrl && parseStatus.includes("menu") && (
                  <span className="ml-1 text-xs font-normal text-green-600">auto</span>
                )}
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="https://…/menu"
                value={menuUrl}
                onChange={(e) => setMenuUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder="Known for their amazing tacos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={parsing}>
              {editRestaurant ? "Save Changes" : "Add Restaurant"}
            </button>
          </div>
        </form>
      </div>

      {showDuplicateConfirm && (
        <ConfirmDialog
          message={`A restaurant with a similar name ("${duplicateMatch}") already exists in the list. Are you sure you want to add "${name.trim()}"?`}
          onConfirm={() => {
            setShowDuplicateConfirm(false);
            submitRestaurant();
          }}
          onCancel={() => setShowDuplicateConfirm(false)}
        />
      )}
    </div>
  );
}
