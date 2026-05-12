import { useApp } from "../store";
import type { View } from "../types";

const TABS: { id: View; label: string; icon: string }[] = [
  { id: "explore", label: "Explore", icon: "🔍" },
  { id: "vote", label: "Vote", icon: "🗳️" },
  { id: "pick", label: "Pick", icon: "🎰" },
  { id: "visited", label: "Visited", icon: "✅" },
  { id: "map", label: "Map", icon: "🗺️" },
  { id: "bill", label: "Bill Pay", icon: "🧾" },
  { id: "thankyou", label: "Thank You", icon: "🙏" },
];

interface HeaderProps {
  onAddClick: () => void;
}

export default function Header({ onAddClick }: HeaderProps) {
  const { currentView, setCurrentView, username, restaurants } = useApp();
  const unvisitedCount = restaurants.filter((r) => !r.visited).length;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto max-w-6xl px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍕</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Friday Feast</h1>
              <p className="text-sm text-gray-500">
                {unvisitedCount} restaurant{unvisitedCount !== 1 ? "s" : ""} to try
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="badge bg-brand-100 text-brand-700">
              Hi, {username}!
            </span>
            <button onClick={onAddClick} className="btn-primary">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Restaurant
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="-mb-px flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm transition-colors ${
                currentView === tab.id ? "tab-active" : "tab-inactive"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
