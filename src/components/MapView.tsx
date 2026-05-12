import { useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useApp } from "../store";
import { PRICE_LABELS } from "../types";
import type { Restaurant } from "../types";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const visitedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "grayscale opacity-60",
});

function MapTooltipCard({ r }: { r: Restaurant }) {
  return (
    <div className="w-64 p-0 font-sans">
      {/* Header */}
      <div className="rounded-t-lg bg-gradient-to-br from-brand-400 to-brand-600 px-3 py-2 text-white">
        <h3 className="text-sm font-bold leading-tight">{r.name}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">
            {r.cuisine}
          </span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">
            {PRICE_LABELS[r.priceRange]}
          </span>
          {r.visited && (
            <span className="rounded-full bg-green-400/30 px-2 py-0.5 text-[11px] font-medium">
              ✓ Visited
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-1.5 px-3 py-2">
        {r.neighborhood && (
          <span className="inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-600">
            {r.neighborhood}
          </span>
        )}

        {r.address && (
          <p className="flex items-start gap-1 text-[11px] text-gray-500 leading-tight">
            <svg className="mt-0.5 h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {r.address}
          </p>
        )}

        <div className="flex items-center gap-2">
          {r.googleRating && (
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
              <svg className="h-3 w-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {r.googleRating}
            </span>
          )}
          {r.votes.length > 0 && (
            <span className="text-[11px] text-gray-400">
              {r.votes.length} vote{r.votes.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {r.visited && (
          <div className="flex items-center gap-1 rounded bg-green-50 px-1.5 py-1">
            {r.rating && (
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-3 w-3 ${star <= r.rating! ? "text-amber-400" : "text-gray-200"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            )}
            <span className="text-[10px] text-green-700">
              {r.visitedBy && <>{r.visitedBy}</>}
              {r.visitedDate && <> · {new Date(r.visitedDate).toLocaleDateString()}</>}
            </span>
          </div>
        )}

        {r.notes && (
          <p className="text-[11px] text-gray-400 line-clamp-2">{r.notes}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-3 py-1.5 text-[10px] text-gray-400">
        <span>by {r.addedBy}</span>
        <div className="flex items-center gap-2">
          {r.menuUrl && (
            <a
              href={r.menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Menu
            </a>
          )}
          <a
            href={r.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + (r.address || ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            Directions
          </a>
        </div>
      </div>
    </div>
  );
}

function RestaurantMarker({ r, onClick }: { r: Restaurant; onClick: () => void }) {
  const markerRef = useRef<L.Marker>(null);

  return (
    <Marker
      ref={markerRef}
      position={[r.latitude!, r.longitude!]}
      icon={r.visited ? visitedIcon : defaultIcon}
      eventHandlers={{ click: onClick }}
    >
      <Tooltip
        direction="top"
        offset={[0, -42]}
        opacity={1}
        className="map-tooltip-card"
      >
        <MapTooltipCard r={r} />
      </Tooltip>
    </Marker>
  );
}

export default function MapView() {
  const { restaurants, setSelectedRestaurant } = useApp();

  const withCoords = useMemo(
    () => restaurants.filter((r) => r.latitude != null && r.longitude != null),
    [restaurants]
  );

  const center = useMemo<[number, number]>(() => {
    if (withCoords.length === 0) return [37.7749, -122.4194];
    const avgLat = withCoords.reduce((s, r) => s + r.latitude!, 0) / withCoords.length;
    const avgLng = withCoords.reduce((s, r) => s + r.longitude!, 0) / withCoords.length;
    return [avgLat, avgLng];
  }, [withCoords]);

  if (withCoords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="mb-4 text-6xl">🗺️</span>
        <p className="text-xl font-bold text-gray-900">No restaurants on the map yet</p>
        <p className="mt-1 text-gray-500">
          Add latitude/longitude coordinates when adding restaurants to see them here.
        </p>
        <p className="mt-4 max-w-md text-sm text-gray-400">
          Tip: You can find coordinates by right-clicking on Google Maps and
          copying the lat/lng values.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] min-h-[400px] overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <MapContainer center={center} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((r) => (
          <RestaurantMarker
            key={r.id}
            r={r}
            onClick={() => setSelectedRestaurant(r)}
          />
        ))}
      </MapContainer>
    </div>
  );
}
