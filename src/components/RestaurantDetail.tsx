import { useState } from "react";
import { useApp } from "../store";
import { PRICE_LABELS } from "../types";
import ConfirmDialog from "./ConfirmDialog";

export default function RestaurantDetail() {
  const { selectedRestaurant, setSelectedRestaurant, markVisited, unmarkVisited, deleteRestaurant, username } = useApp();
  const [rating, setRating] = useState(selectedRestaurant?.rating ?? 0);
  const [reviewNotes, setReviewNotes] = useState(selectedRestaurant?.reviewNotes ?? "");
  const [visitedDate, setVisitedDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [showRating, setShowRating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!selectedRestaurant) return null;
  const r = selectedRestaurant;

  const handleMarkVisited = () => {
    if (rating > 0) {
      markVisited(r.id, rating, reviewNotes, username, new Date(visitedDate).toISOString());
      setSelectedRestaurant(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-20 modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && setSelectedRestaurant(null)}
    >
      <div className="modal-content w-full max-w-lg rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-brand-400 to-brand-600 p-6 text-white">
          <div className="absolute -right-4 -top-4 text-8xl opacity-20">🍽️</div>
          <button
            onClick={() => setSelectedRestaurant(null)}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 transition hover:bg-white/30"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold">{r.name}</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm font-medium">
              {r.cuisine}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm font-medium">
              {PRICE_LABELS[r.priceRange]}
            </span>
            {r.neighborhood && (
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-sm font-medium">
                {r.neighborhood}
              </span>
            )}
            {r.visited && (
              <span className="rounded-full bg-green-400/30 px-3 py-0.5 text-sm font-medium">
                ✓ Visited
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Google Rating */}
          {(r.googleRating || r.menuUrl) && (
            <div className="flex items-center gap-3">
              {r.googleRating && (
                <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5">
                  <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-lg font-bold text-amber-700">{r.googleRating}</span>
                  <span className="text-sm text-amber-600">Google</span>
                </div>
              )}
              {r.menuUrl && (
                <a
                  href={r.menuUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  View Menu
                </a>
              )}
            </div>
          )}

          {r.address && (
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="text-gray-700">{r.address}</span>
            </div>
          )}

          {(r.googleMapsUrl || r.website) && (
            <div className="flex items-start gap-3">
              <svg className="mt-0.5 h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <a
                href={r.googleMapsUrl || r.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 underline decoration-brand-200 hover:decoration-brand-400"
              >
                View on Google Maps
              </a>
            </div>
          )}

          {r.notes && (
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">{r.notes}</p>
            </div>
          )}

          {r.votes.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-gray-500">Votes ({r.votes.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {r.votes.map((v) => (
                  <span key={v} className="badge bg-brand-100 text-brand-700">{v}</span>
                ))}
              </div>
            </div>
          )}

          {/* Visited info */}
          {r.visited && r.rating && (
            <div className="rounded-xl border-2 border-green-100 bg-green-50 p-4">
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-5 w-5 ${star <= r.rating! ? "text-amber-400" : "text-gray-300"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Visited {r.visitedDate && new Date(r.visitedDate).toLocaleDateString()}
                {r.visitedBy && <> by <span className="font-semibold text-gray-700">{r.visitedBy}</span></>}
              </p>
              {r.reviewNotes && (
                <p className="mt-1 text-sm text-gray-600">{r.reviewNotes}</p>
              )}
            </div>
          )}

          {/* Rate section */}
          {!r.visited && (
            <>
              {!showRating ? (
                <button
                  onClick={() => setShowRating(true)}
                  className="btn-primary w-full justify-center"
                >
                  ✓ Mark as Visited & Rate
                </button>
              ) : (
                <div className="rounded-xl border-2 border-brand-200 bg-brand-50 p-4 space-y-3 animate-fade-in">
                  <p className="font-semibold text-gray-800">Rate your experience</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <svg
                          className={`h-8 w-8 ${star <= rating ? "text-amber-400" : "text-gray-300"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Date visited
                    </label>
                    <input
                      type="date"
                      className="input-field w-auto"
                      value={visitedDate}
                      onChange={(e) => setVisitedDate(e.target.value)}
                    />
                  </div>
                  <textarea
                    className="input-field min-h-[60px] resize-none"
                    placeholder="How was it? Any standout dishes?"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowRating(false)} className="btn-secondary flex-1">
                      Cancel
                    </button>
                    <button
                      onClick={handleMarkVisited}
                      disabled={rating === 0}
                      className="btn-primary flex-1 justify-center disabled:opacity-40"
                    >
                      Save Rating
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {r.visited && (
            <button
              onClick={() => {
                unmarkVisited(r.id);
                setSelectedRestaurant(null);
              }}
              className="btn-ghost w-full justify-center text-sm"
            >
              Undo — Mark as Not Visited
            </button>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-400">
            <span>Added by {r.addedBy} on {new Date(r.addedAt).toLocaleDateString()}</span>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          message={`Are you sure you want to delete ${r.name} from the list?`}
          onConfirm={() => {
            deleteRestaurant(r.id);
            setShowConfirm(false);
            setSelectedRestaurant(null);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
