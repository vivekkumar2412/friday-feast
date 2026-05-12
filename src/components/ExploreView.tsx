import { useState, useMemo } from "react";
import { useApp } from "../store";
import { CUISINES, NEIGHBORHOODS, PRICE_LABELS, type CuisineType, type NeighborhoodType } from "../types";
import RestaurantCard from "./RestaurantCard";
import ConfirmDialog from "./ConfirmDialog";
import type { Restaurant } from "../types";

type ViewMode = "cards" | "list";

/** Strip accents/diacritics and lowercase for fuzzy matching */
function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

interface Props {
  onEdit: (r: Restaurant) => void;
}

export default function ExploreView({ onEdit }: Props) {
  const { restaurants } = useApp();
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState<CuisineType>("All");
  const [neighborhood, setNeighborhood] = useState<NeighborhoodType>("All");
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"rating" | "newest" | "name" | "price">("rating");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  const activeNeighborhoods = useMemo(() => {
    const set = new Set(restaurants.map((r) => r.neighborhood));
    return NEIGHBORHOODS.filter((n) => n === "All" || set.has(n));
  }, [restaurants]);

  const filtered = useMemo(() => {
    let list = [...restaurants];

    if (search) {
      const q = normalize(search);
      list = list.filter(
        (r) =>
          normalize(r.name).includes(q) ||
          normalize(r.cuisine).includes(q) ||
          normalize(r.address).includes(q) ||
          normalize(r.neighborhood).includes(q) ||
          normalize(r.notes).includes(q)
      );
    }

    if (cuisine !== "All") {
      list = list.filter((r) => r.cuisine === cuisine);
    }

    if (neighborhood !== "All") {
      list = list.filter((r) => r.neighborhood === neighborhood);
    }

    if (priceFilter) {
      list = list.filter((r) => r.priceRange === priceFilter);
    }

    if (ratingFilter) {
      list = list.filter((r) => (r.googleRating ?? 0) >= ratingFilter);
    }

    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "price") list.sort((a, b) => a.priceRange - b.priceRange);
    else if (sortBy === "newest") list.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    else list.sort((a, b) => (b.googleRating ?? 0) - (a.googleRating ?? 0));

    // Keep unvisited restaurants first, visited ones at the end
    list.sort((a, b) => Number(a.visited) - Number(b.visited));

    return list;
  }, [restaurants, search, cuisine, neighborhood, priceFilter, ratingFilter, sortBy]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Cuisine filter */}
          <select
            className="input-field w-auto"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value as CuisineType)}
          >
            {CUISINES.map((c) => (
              <option key={c} value={c}>
                {c === "All" ? "All Cuisines" : c}
              </option>
            ))}
          </select>

          {/* Neighborhood filter */}
          <select
            className="input-field w-auto"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value as NeighborhoodType)}
          >
            {activeNeighborhoods.map((n) => (
              <option key={n} value={n}>
                {n === "All" ? "All Neighborhoods" : n}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            className="input-field w-auto"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "rating" | "newest" | "name" | "price")}
          >
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest First</option>
            <option value="name">A → Z</option>
            <option value="price">Price: Low → High</option>
          </select>

          {/* View toggle */}
          <div className="flex rounded-xl border-2 border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-2 transition-colors ${
                viewMode === "cards"
                  ? "bg-brand-500 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              title="Card view"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 transition-colors ${
                viewMode === "list"
                  ? "bg-brand-500 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              title="List view"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Price filter chips */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Price:</span>
            {[null, 1, 2, 3, 4].map((p) => (
              <button
                key={p ?? "all"}
                onClick={() => setPriceFilter(p)}
                className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  priceFilter === p
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === null ? "All" : "$".repeat(p)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rating:</span>
            {[null, 4.0, 4.3, 4.5, 4.7].map((r) => (
              <button
                key={r ?? "all"}
                onClick={() => setRatingFilter(r)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                  ratingFilter === r
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {r === null ? (
                  "All"
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {r}+
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="mb-3 text-5xl">🍽️</span>
          <p className="text-lg font-semibold text-gray-900">No restaurants found</p>
          <p className="text-gray-500">
            {restaurants.length === 0
              ? "Add your first restaurant to get started!"
              : "Try adjusting your filters."}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} onEdit={onEdit} />
          ))}
        </div>
      ) : (
        <ListView items={filtered} onEdit={onEdit} />
      )}
    </div>
  );
}

function ListView({ items, onEdit }: { items: Restaurant[]; onEdit: (r: Restaurant) => void }) {
  const { setSelectedRestaurant, deleteRestaurant } = useApp();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmRestaurant = confirmId ? items.find((r) => r.id === confirmId) : null;

  return (
    <>
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_100px_100px_90px_80px_80px] gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        <span>Restaurant</span>
        <span>Cuisine</span>
        <span>Neighborhood</span>
        <span>Price</span>
        <span>Rating</span>
        <span className="text-right">Links</span>
      </div>

      {/* Rows */}
      {items.map((r, i) => (
        <div
          key={r.id}
          onClick={() => setSelectedRestaurant(r)}
          className={`group grid sm:grid-cols-[1fr_100px_100px_90px_80px_80px] gap-2 px-4 py-3 cursor-pointer transition-colors hover:bg-brand-50 ${
            i !== items.length - 1 ? "border-b border-gray-100" : ""
          } ${r.visited ? "bg-green-50/40" : ""}`}
        >
          {/* Name + address */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 truncate">{r.name}</span>
              {r.visited && (
                <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                  Visited
                </span>
              )}
            </div>
            {r.address && (
              <p className="text-xs text-gray-400 truncate">{r.address}</p>
            )}
            {r.visited && r.visitedBy && (
              <p className="text-[11px] text-green-600 mt-0.5">
                by {r.visitedBy}
                {r.visitedDate && <> · {new Date(r.visitedDate).toLocaleDateString()}</>}
              </p>
            )}
          </div>

          {/* Cuisine */}
          <div className="flex items-center">
            <span className="text-sm text-gray-600 truncate">{r.cuisine}</span>
          </div>

          {/* Neighborhood */}
          <div className="flex items-center">
            <span className="text-sm text-gray-600 truncate">{r.neighborhood || "—"}</span>
          </div>

          {/* Price */}
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700">{PRICE_LABELS[r.priceRange]}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            {r.googleRating ? (
              <>
                <svg className="h-3.5 w-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-semibold text-amber-700">{r.googleRating}</span>
              </>
            ) : (
              <span className="text-sm text-gray-300">—</span>
            )}
          </div>

          {/* Links */}
          <div className="flex items-center justify-end gap-2">
            {r.menuUrl && (
              <a
                href={r.menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                title="View Menu"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </a>
            )}
            {(r.googleMapsUrl || (r.latitude != null && r.longitude != null)) && (
              <a
                href={r.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + (r.address || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                title="View on Map"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </a>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(r);
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-all"
              title="Edit"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmId(r.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              title="Delete"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>

    {confirmRestaurant && (
      <ConfirmDialog
        message={`Are you sure you want to delete ${confirmRestaurant.name} from the list?`}
        onConfirm={() => {
          deleteRestaurant(confirmRestaurant.id);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    )}
    </>
  );
}
