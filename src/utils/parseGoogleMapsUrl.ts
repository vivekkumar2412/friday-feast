import { CUISINES, NEIGHBORHOODS } from "../types";

export interface ParsedMapData {
  latitude?: number;
  longitude?: number;
  address?: string;
  neighborhood?: string;
  placeName?: string;
  cuisine?: string;
  notes?: string;
  googleRating?: number;
  menuUrl?: string;
  website?: string;
}

const CUISINE_KEYWORDS: Record<string, string> = {
  italian: "Italian",
  pizza: "Pizza",
  mexican: "Mexican",
  taco: "Mexican",
  japanese: "Japanese",
  sushi: "Japanese",
  ramen: "Japanese",
  chinese: "Chinese",
  "dim sum": "Chinese",
  indian: "Indian",
  curry: "Indian",
  thai: "Thai",
  american: "American",
  burger: "Burgers",
  mediterranean: "Mediterranean",
  korean: "Korean",
  vietnamese: "Vietnamese",
  pho: "Vietnamese",
  french: "French",
  ethiopian: "Ethiopian",
  greek: "Greek",
  "middle eastern": "Middle Eastern",
  falafel: "Middle Eastern",
  kebab: "Middle Eastern",
  bbq: "BBQ",
  barbecue: "BBQ",
  seafood: "Seafood",
};

function extractCoords(url: string): { lat: number; lng: number } | null {
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  const queryMatch = url.match(/query=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (queryMatch) return { lat: parseFloat(queryMatch[1]), lng: parseFloat(queryMatch[2]) };

  const dataMatch = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (dataMatch) return { lat: parseFloat(dataMatch[1]), lng: parseFloat(dataMatch[2]) };

  return null;
}

function extractPlaceName(url: string): string | null {
  const placeMatch = url.match(/\/place\/([^/@]+)/);
  if (placeMatch) {
    return decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
  }
  return null;
}

function detectCuisine(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [keyword, cuisineType] of Object.entries(CUISINE_KEYWORDS)) {
    if (lower.includes(keyword)) {
      if (CUISINES.includes(cuisineType as any)) return cuisineType;
    }
  }
  return undefined;
}

function matchNeighborhood(addressParts: Record<string, string>): string {
  const suburb = addressParts.suburb || addressParts.neighbourhood || addressParts.city_district || "";
  const city = addressParts.city || addressParts.town || "";
  const combined = `${suburb} ${city}`.toLowerCase();

  for (const n of NEIGHBORHOODS) {
    if (n === "All" || n === "Other") continue;
    if (combined.includes(n.toLowerCase())) return n;
  }

  const aliasMap: Record<string, string> = {
    "international district": "Chinatown-ID",
    chinatown: "Chinatown-ID",
    "pike place": "Pike Place Market",
    "south lake union": "South Lake Union",
    "university district": "University District",
    "central district": "Central District",
    "central area": "Central District",
    "beacon hill": "Beacon Hill",
    "capitol hill": "Capitol Hill",
    "queen anne": "Queen Anne",
    "white center": "White Center",
    "rainier valley": "Rainier Valley",
    "rainier beach": "Rainier Valley",
    "columbia city": "Rainier Valley",
    "hillman city": "Hillman City",
    "pioneer square": "Pioneer Square",
    "madison park": "Madison Park",
  };

  for (const [alias, neighborhood] of Object.entries(aliasMap)) {
    if (combined.includes(alias)) return neighborhood;
  }

  return "Other";
}

async function resolveShortUrl(url: string): Promise<string> {
  if (!url.includes("maps.app.goo.gl") && !url.includes("goo.gl/maps")) return url;

  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
    const text = await res.text();
    const metaMatch = text.match(/content="0;url=(https:\/\/www\.google\.com\/maps[^"]+)"/i);
    if (metaMatch) return metaMatch[1];
    const scriptMatch = text.match(/(https:\/\/www\.google\.com\/maps\/place\/[^"'\s\\]+)/);
    if (scriptMatch) return scriptMatch[1];
    return url;
  } catch {
    return url;
  }
}

async function fetchPageMetadata(url: string): Promise<Partial<ParsedMapData>> {
  const result: Partial<ParsedMapData> = {};

  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    const html = await res.text();

    // Extract og:title — usually "Restaurant Name - Google Maps" or the business name
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
      || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);
    if (ogTitle) {
      const title = ogTitle[1].replace(/ - Google Maps$/i, "").trim();
      if (title) result.placeName = title;
    }

    // Extract og:description — often contains category, address, rating info
    const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i)
      || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:description"/i);
    if (ogDesc) {
      const desc = ogDesc[1];

      // Try to extract rating: patterns like "4.5 stars" or "★ 4.5" or "rated 4.5"
      const ratingMatch = desc.match(/(\d\.?\d?)\s*(?:stars?|★)/i)
        || desc.match(/(?:rated?|rating:?)\s*(\d\.?\d?)/i);
      if (ratingMatch) {
        const r = parseFloat(ratingMatch[1]);
        if (r >= 1 && r <= 5) result.googleRating = r;
      }

      // Cuisine detection from description
      result.cuisine = detectCuisine(desc);

      // Use description as notes
      result.notes = desc;
    }

    // Try to find a website link — often in the page source
    const websiteMatch = html.match(/"website"\s*:\s*"(https?:\/\/[^"]+)"/i)
      || html.match(/data-website="(https?:\/\/[^"]+)"/i);
    if (websiteMatch) result.website = websiteMatch[1];

    // Try to find menu URL
    const menuMatch = html.match(/"menu(?:_url|Url)?"\s*:\s*"(https?:\/\/[^"]+)"/i)
      || html.match(/href="(https?:\/\/[^"]*menu[^"]*)"/i);
    if (menuMatch) result.menuUrl = menuMatch[1];

    // Additional cuisine detection from title
    if (!result.cuisine && result.placeName) {
      result.cuisine = detectCuisine(result.placeName);
    }

  } catch {
    // Page fetch failed — not critical, we still have coordinates
  }

  return result;
}

export async function parseGoogleMapsLink(rawUrl: string): Promise<ParsedMapData> {
  const url = await resolveShortUrl(rawUrl.trim());
  const result: ParsedMapData = {};

  // Extract place name from URL path
  const urlName = extractPlaceName(url);
  if (urlName) result.placeName = urlName;

  // Extract coordinates
  const coords = extractCoords(url);
  if (coords) {
    result.latitude = coords.lat;
    result.longitude = coords.lng;
  }

  // Fetch page metadata and reverse geocode in parallel
  const [pageData, geoData] = await Promise.all([
    fetchPageMetadata(url),
    coords
      ? fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&addressdetails=1`,
          { headers: { "User-Agent": "FridayFeast/1.0" } }
        )
          .then((r) => r.json())
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  // Merge page metadata (prefer page data over URL-extracted name)
  if (pageData.placeName) result.placeName = pageData.placeName;
  if (pageData.cuisine) result.cuisine = pageData.cuisine;
  if (pageData.notes) result.notes = pageData.notes;
  if (pageData.googleRating) result.googleRating = pageData.googleRating;
  if (pageData.menuUrl) result.menuUrl = pageData.menuUrl;
  if (pageData.website) result.website = pageData.website;

  // Process reverse geocoding
  if (geoData?.address) {
    const a = geoData.address;
    const parts = [
      a.house_number,
      a.road,
      a.suburb || a.neighbourhood,
      a.city || a.town,
      a.state,
      a.postcode,
    ].filter(Boolean);
    result.address = parts.join(", ");
    result.neighborhood = matchNeighborhood(a);
  }

  // If no cuisine from page, try from place name
  if (!result.cuisine && result.placeName) {
    result.cuisine = detectCuisine(result.placeName);
  }

  return result;
}
