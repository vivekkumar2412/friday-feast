import { useState, useMemo } from "react";
import { useApp } from "../store";
import { CUISINES, NEIGHBORHOODS, type CuisineType, type NeighborhoodType } from "../types";
import RestaurantCard from "./RestaurantCard";

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function VoteView() {
  const { restaurants, username } = useApp();
  const [search, setSearch] = useState("");
  const [cuisine, setCuisine] = useState<CuisineType>("All");
  const [neighborhood, setNeighborhood] = useState<NeighborhoodType>("All");
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"votes" | "rating" | "name" | "price">("votes");

  const unvisited = useMemo(
    () => restaurants.filter((r) => !r.visited),
    [restaurants]
  );

  const activeNeighborhoods = useMemo(() => {
    const set = new Set(unvisited.map((r) => r.neighborhood));
    return NEIGHBORHOODS.filter((n) => n === "All" || set.has(n));
  }, [unvisited]);

  const filtered = useMemo(() => {
    let list = [...unvisited];

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
    else if (sortBy === "rating") list.sort((a, b) => (b.googleRating ?? 0) - (a.googleRating ?? 0));
    else list.sort((a, b) => b.votes.length - a.votes.length);

    return list;
  }, [unvisited, search, cuisine, neighborhood, priceFilter, ratingFilter, sortBy]);

  const totalVoters = useMemo(() => {
    const names = new Set<string>();
    filtered.forEach((r) => r.votes.forEach((v) => names.add(v)));
    return names.size;
  }, [filtered]);

  const myVotes = useMemo(
    () => filtered.filter((r) => r.votes.includes(username)),
    [filtered, username]
  );

  const topPicks = filtered.filter((r) => r.votes.length > 0);
  const rest = filtered.filter((r) => r.votes.length === 0);

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-50 to-orange-50 p-5">
        <h2 className="text-lg font-bold text-gray-900">
          🗳️ Vote for This Friday's Pick
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Click the thumbs up on any restaurant to cast your vote. The most
          popular pick wins!
        </p>
        <div className="mt-3 flex gap-4 text-sm">
          <span className="font-medium text-gray-700">
            {totalVoters} voter{totalVoters !== 1 ? "s" : ""}
          </span>
          <span className="font-medium text-brand-600">
            Your votes: {myVotes.length}
          </span>
        </div>
      </div>

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
            onChange={(e) => setSortBy(e.target.value as "votes" | "rating" | "name" | "price")}
          >
            <option value="votes">Most Votes</option>
            <option value="rating">Highest Rated</option>
            <option value="name">A → Z</option>
            <option value="price">Price: Low → High</option>
          </select>
        </div>

        {/* Price & rating filter chips */}
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

      {/* Top picks */}
      {topPicks.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Top Picks
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topPicks.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} showVote />
            ))}
          </div>
        </div>
      )}

      {/* All restaurants */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
          {topPicks.length > 0 ? "All Restaurants" : "Restaurants"}
        </h3>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="mb-3 block text-4xl">📋</span>
            <p className="text-gray-500">
              {unvisited.length === 0
                ? "No restaurants to vote on. Add some first!"
                : "No restaurants match your filters."}
            </p>
          </div>
        ) : rest.length === 0 && topPicks.length > 0 ? null : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} showVote />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
