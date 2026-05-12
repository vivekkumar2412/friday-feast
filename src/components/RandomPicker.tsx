import { useState, useMemo, useRef } from "react";
import { useApp } from "../store";
import { PRICE_LABELS } from "../types";

const WHEEL_COLORS = [
  "#f97316", "#3b82f6", "#10b981", "#f59e0b",
  "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899",
  "#14b8a6", "#6366f1", "#f43f5e", "#84cc16",
];

export default function RandomPicker() {
  const { restaurants, setSelectedRestaurant } = useApp();
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [useVotedOnly, setUseVotedOnly] = useState(true);
  const wheelRef = useRef<HTMLDivElement>(null);

  const candidates = useMemo(() => {
    const unvisited = restaurants.filter((r) => !r.visited);
    if (useVotedOnly) {
      const voted = unvisited.filter((r) => r.votes.length > 0);
      return voted.length > 0 ? voted : unvisited;
    }
    return unvisited;
  }, [restaurants, useVotedOnly]);

  const spin = () => {
    if (spinning || candidates.length === 0) return;
    setSpinning(true);
    setWinner(null);

    const winnerIndex = Math.floor(Math.random() * candidates.length);
    const segmentDeg = 360 / candidates.length;
    const targetDeg = 360 - (winnerIndex * segmentDeg + segmentDeg / 2);
    const totalSpin = 1800 + targetDeg + Math.random() * 30;

    if (wheelRef.current) {
      wheelRef.current.style.transition = "none";
      wheelRef.current.style.transform = "rotate(0deg)";
      // Force reflow
      void wheelRef.current.offsetHeight;
      wheelRef.current.style.transition = "transform 4s cubic-bezier(0.2, 0.8, 0.3, 1)";
      wheelRef.current.style.transform = `rotate(${totalSpin}deg)`;
    }

    setTimeout(() => {
      setSpinning(false);
      setWinner(candidates[winnerIndex].id);
    }, 4200);
  };

  const winnerRestaurant = winner
    ? candidates.find((r) => r.id === winner)
    : null;

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="mb-4 text-6xl">🎰</span>
        <p className="text-xl font-bold text-gray-900">No restaurants to pick from</p>
        <p className="mt-1 text-gray-500">
          Add some restaurants and vote on them first!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Controls */}
      <div className="mb-6 flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useVotedOnly}
            onChange={(e) => setUseVotedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
          />
          <span className="text-sm text-gray-700">Only voted restaurants</span>
        </label>
        <span className="text-sm text-gray-400">
          ({candidates.length} candidate{candidates.length !== 1 ? "s" : ""})
        </span>
      </div>

      {/* Wheel */}
      <div className="relative mb-8">
        {/* Pointer */}
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
          <div className="h-0 w-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-gray-800" />
        </div>

        <div className="h-72 w-72 overflow-hidden rounded-full border-4 border-gray-800 shadow-xl sm:h-80 sm:w-80">
          <div ref={wheelRef} className="h-full w-full">
            <svg viewBox="0 0 200 200" className="h-full w-full">
              {candidates.map((r, i) => {
                const segDeg = 360 / candidates.length;
                const startAngle = i * segDeg - 90;
                const endAngle = startAngle + segDeg;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const x1 = 100 + 100 * Math.cos(startRad);
                const y1 = 100 + 100 * Math.sin(startRad);
                const x2 = 100 + 100 * Math.cos(endRad);
                const y2 = 100 + 100 * Math.sin(endRad);
                const largeArc = segDeg > 180 ? 1 : 0;
                const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;
                const textX = 100 + 60 * Math.cos(midAngle);
                const textY = 100 + 60 * Math.sin(midAngle);
                const textRotation = (startAngle + endAngle) / 2 + 90;
                const color = WHEEL_COLORS[i % WHEEL_COLORS.length];

                return (
                  <g key={r.id}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 ${largeArc},1 ${x2},${y2} Z`}
                      fill={color}
                      stroke="white"
                      strokeWidth="1"
                    />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                      fill="white"
                      fontSize={candidates.length > 8 ? "5" : candidates.length > 5 ? "6" : "7"}
                      fontWeight="bold"
                    >
                      {r.name.length > 12 ? r.name.slice(0, 11) + "…" : r.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning}
        className="btn-primary mb-8 px-10 py-3 text-lg disabled:animate-pulse"
      >
        {spinning ? "Spinning..." : "🎲 Spin the Wheel!"}
      </button>

      {/* Winner announcement */}
      {winnerRestaurant && !spinning && (
        <div
          className="w-full max-w-md animate-bounce-in cursor-pointer rounded-2xl border-2 border-brand-300 bg-gradient-to-br from-brand-50 to-orange-50 p-6 text-center shadow-lg"
          onClick={() => setSelectedRestaurant(winnerRestaurant)}
        >
          <p className="mb-1 text-sm font-medium text-brand-600">
            This Friday, you're going to...
          </p>
          <h3 className="text-2xl font-bold text-gray-900">
            🎉 {winnerRestaurant.name}
          </h3>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="badge bg-brand-100 text-brand-700">
              {winnerRestaurant.cuisine}
            </span>
            <span className="badge bg-gray-100 text-gray-700">
              {PRICE_LABELS[winnerRestaurant.priceRange]}
            </span>
          </div>
          {winnerRestaurant.address && (
            <p className="mt-2 text-sm text-gray-500">
              📍 {winnerRestaurant.address}
            </p>
          )}
          <p className="mt-3 text-xs text-gray-400">Click for details</p>
        </div>
      )}
    </div>
  );
}
