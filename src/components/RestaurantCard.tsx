import { useState } from "react";
import { useApp } from "../store";
import { PRICE_LABELS } from "../types";
import type { Restaurant } from "../types";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  restaurant: Restaurant;
  showVote?: boolean;
  onEdit?: (r: Restaurant) => void;
}

export default function RestaurantCard({ restaurant, showVote, onEdit }: Props) {
  const { toggleVote, username, setSelectedRestaurant, deleteRestaurant } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const hasVoted = restaurant.votes.includes(username);

  const cuisineColors: Record<string, string> = {
    Italian: "bg-red-100 text-red-700",
    Mexican: "bg-green-100 text-green-700",
    Japanese: "bg-pink-100 text-pink-700",
    Chinese: "bg-yellow-100 text-yellow-700",
    Indian: "bg-orange-100 text-orange-700",
    Thai: "bg-purple-100 text-purple-700",
    American: "bg-blue-100 text-blue-700",
    Mediterranean: "bg-cyan-100 text-cyan-700",
    Korean: "bg-rose-100 text-rose-700",
    Vietnamese: "bg-emerald-100 text-emerald-700",
    French: "bg-indigo-100 text-indigo-700",
    Ethiopian: "bg-amber-100 text-amber-700",
    Greek: "bg-sky-100 text-sky-700",
    "Middle Eastern": "bg-teal-100 text-teal-700",
    BBQ: "bg-red-100 text-red-700",
    Seafood: "bg-blue-100 text-blue-700",
    Pizza: "bg-orange-100 text-orange-700",
    Burgers: "bg-yellow-100 text-yellow-700",
  };

  const colorClass = cuisineColors[restaurant.cuisine] || "bg-gray-100 text-gray-700";

  return (
    <>
      <div className="card group animate-fade-in cursor-pointer" onClick={() => setSelectedRestaurant(restaurant)}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 truncate text-lg">
                {restaurant.name}
              </h3>
              {restaurant.visited && (
                <span className="badge bg-green-100 text-green-700">Visited</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`badge ${colorClass}`}>{restaurant.cuisine}</span>
              <span className="badge bg-gray-100 text-gray-600">
                {PRICE_LABELS[restaurant.priceRange]}
              </span>
              {restaurant.neighborhood && (
                <span className="badge bg-blue-50 text-blue-600">
                  {restaurant.neighborhood}
                </span>
              )}
              {restaurant.googleRating && (
                <span className="badge bg-amber-50 text-amber-700 gap-0.5">
                  <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {restaurant.googleRating}
                </span>
              )}
            </div>

            {restaurant.address && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
                <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span className="truncate">{restaurant.address}</span>
              </p>
            )}

            {restaurant.notes && (
              <p className="text-sm text-gray-400 truncate">{restaurant.notes}</p>
            )}

            {restaurant.visited && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 px-2.5 py-1.5">
                {restaurant.rating && (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= restaurant.rating! ? "text-amber-400" : "text-gray-200"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                )}
                <span className="text-xs text-green-700">
                  Visited{restaurant.visitedBy && <> by <span className="font-semibold">{restaurant.visitedBy}</span></>}
                  {restaurant.visitedDate && <> on {new Date(restaurant.visitedDate).toLocaleDateString()}</>}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 ml-3">
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(restaurant);
                  }}
                  className="btn-ghost !p-1.5 !rounded-lg"
                  title="Edit"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
                className="btn-ghost !p-1.5 !rounded-lg text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>

            {showVote && !restaurant.visited && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVote(restaurant.id);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-all ${
                  hasVoted
                    ? "bg-brand-100 text-brand-700 ring-2 ring-brand-300"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <svg className="h-4 w-4" fill={hasVoted ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                </svg>
                {restaurant.votes.length || ""}
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>Added by {restaurant.addedBy}</span>
          <div className="flex items-center gap-3">
            {restaurant.menuUrl && (
              <a
                href={restaurant.menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                Menu
              </a>
            )}
            {(restaurant.googleMapsUrl || (restaurant.latitude != null && restaurant.longitude != null)) && (
              <a
                href={restaurant.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + (restaurant.address || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                Map
              </a>
            )}
            <span>{new Date(restaurant.addedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          message={`Are you sure you want to delete ${restaurant.name} from the list?`}
          onConfirm={() => {
            deleteRestaurant(restaurant.id);
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
