import { useState } from "react";
import { useApp } from "./store";
import type { Restaurant } from "./types";
import UsernameModal from "./components/UsernameModal";
import Header from "./components/Header";
import ExploreView from "./components/ExploreView";
import VoteView from "./components/VoteView";
import RandomPicker from "./components/RandomPicker";
import VisitedView from "./components/VisitedView";
import MapView from "./components/MapView";
import BillPayView from "./components/BillPayView";
import ThankYouView from "./components/ThankYouView";
import AddRestaurantModal from "./components/AddRestaurantModal";
import RestaurantDetail from "./components/RestaurantDetail";
import ChatWidget from "./components/ChatWidget";

export default function App() {
  const { username, currentView, selectedRestaurant } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRestaurant, setEditRestaurant] = useState<Restaurant | null>(null);

  if (!username) return <UsernameModal />;

  const handleEdit = (r: Restaurant) => {
    setEditRestaurant(r);
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAddClick={() => setShowAddModal(true)} />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {currentView === "explore" && <ExploreView onEdit={handleEdit} />}
        {currentView === "vote" && <VoteView />}
        {currentView === "pick" && <RandomPicker />}
        {currentView === "visited" && <VisitedView />}
        {currentView === "map" && <MapView />}
        {currentView === "bill" && <BillPayView />}
        {currentView === "thankyou" && <ThankYouView />}
      </main>

      {showAddModal && (
        <AddRestaurantModal
          editRestaurant={editRestaurant}
          onClose={() => {
            setShowAddModal(false);
            setEditRestaurant(null);
          }}
        />
      )}

      {selectedRestaurant && <RestaurantDetail />}

      <ChatWidget />
    </div>
  );
}
