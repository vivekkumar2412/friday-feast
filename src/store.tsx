import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type { Restaurant, View, Bill, BillRow } from "./types";
import { BILL_FAMILIES } from "./types";
import { SEED_RESTAURANTS } from "./seedData";

const STORAGE_KEY = "friday-feast-restaurants";
const USER_KEY = "friday-feast-username";
const BILLS_KEY = "friday-feast-bills";

const SEED_NAMES = ["Vivek", "Garima", "Veni", "Suhel", "Asmita", "Akshay"];
const SEED_DATE_START = new Date("2026-04-20T00:00:00").getTime();
const SEED_DATE_END = new Date("2026-04-30T23:59:59").getTime();

function randomDate(): string {
  const ts = SEED_DATE_START + Math.random() * (SEED_DATE_END - SEED_DATE_START);
  return new Date(ts).toISOString();
}

function buildSeedList(): Restaurant[] {
  return SEED_RESTAURANTS.map((r) => ({
    ...r,
    id: uuidv4(),
    addedBy: SEED_NAMES[Math.floor(Math.random() * SEED_NAMES.length)],
    addedAt: randomDate(),
    visited: false,
    votes: [],
    googleMapsUrl:
      r.latitude && r.longitude
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + " " + r.address)}`
        : undefined,
  }));
}

function loadRestaurants(): Restaurant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    // Nothing stored yet — first visit, populate with seed data
    if (raw === null) {
      return buildSeedList();
    }

    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveRestaurants(list: Restaurant[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadBills(): Bill[] {
  try {
    const raw = localStorage.getItem(BILLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBills(list: Bill[]) {
  localStorage.setItem(BILLS_KEY, JSON.stringify(list));
}

interface AppState {
  restaurants: Restaurant[];
  bills: Bill[];
  currentView: View;
  username: string;
  selectedRestaurant: Restaurant | null;
  setCurrentView: (v: View) => void;
  setUsername: (name: string) => void;
  setSelectedRestaurant: (r: Restaurant | null) => void;
  addRestaurant: (r: Omit<Restaurant, "id" | "addedAt" | "visited" | "votes">) => void;
  updateRestaurant: (r: Restaurant) => void;
  deleteRestaurant: (id: string) => void;
  toggleVote: (restaurantId: string) => void;
  markVisited: (id: string, rating: number, reviewNotes: string, visitedBy: string, visitedDate: string) => void;
  unmarkVisited: (id: string) => void;
  addBill: (restaurantName: string, date: string, googleSheetUrl?: string) => Bill;
  updateBill: (bill: Bill) => void;
  deleteBill: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(loadRestaurants);
  const [currentView, setCurrentView] = useState<View>("explore");
  const [username, setUsernameState] = useState(
    () => localStorage.getItem(USER_KEY) || ""
  );
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [bills, setBills] = useState<Bill[]>(loadBills);

  useEffect(() => {
    saveRestaurants(restaurants);
  }, [restaurants]);

  useEffect(() => {
    saveBills(bills);
  }, [bills]);

  const setUsername = useCallback((name: string) => {
    setUsernameState(name);
    localStorage.setItem(USER_KEY, name);
  }, []);

  const addRestaurant = useCallback(
    (r: Omit<Restaurant, "id" | "addedAt" | "visited" | "votes">) => {
      const newR: Restaurant = {
        ...r,
        id: uuidv4(),
        addedAt: new Date().toISOString(),
        visited: false,
        votes: [],
      };
      setRestaurants((prev) => [newR, ...prev]);
    },
    []
  );

  const updateRestaurant = useCallback((updated: Restaurant) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  }, []);

  const deleteRestaurant = useCallback((id: string) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    setSelectedRestaurant(null);
  }, []);

  const toggleVote = useCallback(
    (restaurantId: string) => {
      if (!username) return;
      setRestaurants((prev) =>
        prev.map((r) => {
          if (r.id !== restaurantId) return r;
          const hasVoted = r.votes.includes(username);
          return {
            ...r,
            votes: hasVoted
              ? r.votes.filter((v) => v !== username)
              : [...r.votes, username],
          };
        })
      );
    },
    [username]
  );

  const markVisited = useCallback(
    (id: string, rating: number, reviewNotes: string, visitedBy: string, visitedDate: string) => {
      setRestaurants((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                visited: true,
                visitedBy,
                visitedDate: visitedDate || new Date().toISOString(),
                rating,
                reviewNotes,
                votes: [],
              }
            : r
        )
      );
    },
    []
  );

  const addBill = useCallback(
    (restaurantName: string, date: string, googleSheetUrl?: string): Bill => {
      const emptyRow = (): BillRow => ({
        item: "",
        amounts: Object.fromEntries(BILL_FAMILIES.map((f) => [f, 0])) as BillRow["amounts"],
      });
      const bill: Bill = {
        id: uuidv4(),
        restaurantName,
        date,
        createdBy: username,
        createdAt: new Date().toISOString(),
        rows: Array.from({ length: 5 }, emptyRow),
        tax: Object.fromEntries(BILL_FAMILIES.map((f) => [f, 0])) as Bill["tax"],
        tip: Object.fromEntries(BILL_FAMILIES.map((f) => [f, 0])) as Bill["tip"],
        googleSheetUrl: googleSheetUrl || undefined,
      };
      setBills((prev) => [bill, ...prev]);
      return bill;
    },
    [username]
  );

  const updateBill = useCallback((updated: Bill) => {
    setBills((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }, []);

  const deleteBill = useCallback((id: string) => {
    setBills((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const unmarkVisited = useCallback((id: string) => {
    setRestaurants((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              visited: false,
              visitedDate: undefined,
              rating: undefined,
              reviewNotes: undefined,
            }
          : r
      )
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        restaurants,
        bills,
        currentView,
        username,
        selectedRestaurant,
        setCurrentView,
        setUsername,
        setSelectedRestaurant,
        addRestaurant,
        updateRestaurant,
        deleteRestaurant,
        toggleVote,
        markVisited,
        unmarkVisited,
        addBill,
        updateBill,
        deleteBill,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
