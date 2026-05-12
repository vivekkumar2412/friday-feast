export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  neighborhood: string;
  address: string;
  priceRange: 1 | 2 | 3 | 4;
  notes: string;
  addedBy: string;
  addedAt: string;
  visited: boolean;
  visitedBy?: string;
  visitedDate?: string;
  rating?: number;
  reviewNotes?: string;
  votes: string[];
  latitude?: number;
  longitude?: number;
  website?: string;
  googleRating?: number;
  menuUrl?: string;
  googleMapsUrl?: string;
}

export type View =
  | "explore"
  | "vote"
  | "pick"
  | "visited"
  | "map"
  | "bill"
  | "thankyou";

export const BILL_FAMILIES = ["Ashrits", "Banerjees", "Joglekars", "Iyers", "Mehta", "Mishras"] as const;
export type BillFamily = (typeof BILL_FAMILIES)[number];

export interface BillRow {
  item: string;
  amounts: Record<BillFamily, number>;
}

export interface Bill {
  id: string;
  restaurantName: string;
  date: string;
  createdBy: string;
  createdAt: string;
  rows: BillRow[];
  tax: Record<BillFamily, number>;
  tip: Record<BillFamily, number>;
  googleSheetUrl?: string;
}

export type CuisineType =
  | "All"
  | "Italian"
  | "Mexican"
  | "Japanese"
  | "Chinese"
  | "Indian"
  | "Thai"
  | "American"
  | "Mediterranean"
  | "Korean"
  | "Vietnamese"
  | "French"
  | "Ethiopian"
  | "Greek"
  | "Middle Eastern"
  | "BBQ"
  | "Seafood"
  | "Pizza"
  | "Burgers"
  | "Other";

export const CUISINES: CuisineType[] = [
  "All",
  "American",
  "BBQ",
  "Burgers",
  "Chinese",
  "Ethiopian",
  "French",
  "Greek",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Mediterranean",
  "Mexican",
  "Middle Eastern",
  "Pizza",
  "Seafood",
  "Thai",
  "Vietnamese",
  "Other",
];

export const NEIGHBORHOODS = [
  "All",
  "Ballard",
  "Beacon Hill",
  "Bellevue",
  "Belltown",
  "Bothell",
  "Capitol Hill",
  "Central District",
  "Chinatown-ID",
  "Downtown",
  "Fremont",
  "Georgetown",
  "Hillman City",
  "Kirkland",
  "Madison Park",
  "Pike Place Market",
  "Pioneer Square",
  "Queen Anne",
  "Rainier Valley",
  "South Lake Union",
  "Tacoma",
  "University District",
  "Wallingford",
  "White Center",
  "Woodinville",
  "Other",
] as const;

export type NeighborhoodType = (typeof NEIGHBORHOODS)[number];

export const PRICE_LABELS: Record<number, string> = {
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$$",
};
