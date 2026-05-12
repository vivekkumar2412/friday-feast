import { useMemo, useState } from "react";
import { useApp } from "../store";
import RestaurantCard from "./RestaurantCard";

export default function VisitedView() {
  const { restaurants } = useApp();
  const [sortBy, setSortBy] = useState<"date" | "rating">("date");

  const visited = useMemo(() => {
    const list = restaurants.filter((r) => r.visited);
    if (sortBy === "rating") {
      return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return [...list].sort(
      (a, b) =>
        new Date(b.visitedDate ?? b.addedAt).getTime() -
        new Date(a.visitedDate ?? a.addedAt).getTime()
    );
  }, [restaurants, sortBy]);

  const avgRating = useMemo(() => {
    const rated = visited.filter((r) => r.rating);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length;
  }, [visited]);

  return (
    <div>
      {/* Stats banner */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{visited.length}</p>
          <p className="text-sm text-green-600">Places Visited</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 p-4 text-center">
          <p className="text-3xl font-bold text-amber-700">
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </p>
          <p className="text-sm text-amber-600">Avg Rating</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">
            {new Set(visited.map((r) => r.cuisine)).size}
          </p>
          <p className="text-sm text-blue-600">Cuisines Tried</p>
        </div>
      </div>

      {/* Sort */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
          Visit History
        </h3>
        <select
          className="input-field w-auto !py-1.5 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "rating")}
        >
          <option value="date">Most Recent</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {visited.length === 0 ? (
        <div className="py-16 text-center">
          <span className="mb-3 block text-5xl">📝</span>
          <p className="text-lg font-semibold text-gray-900">No visits yet</p>
          <p className="text-gray-500">
            After your next Friday dinner, come back and rate it!
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visited.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}
