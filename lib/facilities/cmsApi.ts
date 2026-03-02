// CMS Provider Data API client for nursing home facility search
// Uses the free public API (no key required) — ~14,700 nursing homes with quality ratings

const CMS_API_URL =
  "https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0";

const CMS_FIELDS = [
  "provider_name",
  "provider_address",
  "citytown",
  "state",
  "zip_code",
  "telephone_number",
  "overall_rating",
  "health_inspection_rating",
  "staffing_rating",
  "qm_rating",
  "number_of_certified_beds",
  "provider_type",
  "ownership_type",
  "abuse_icon",
  "number_of_fines",
  "total_amount_of_fines_in_dollars",
  "total_nursing_staff_turnover",
  "latitude",
  "longitude",
];

export interface CmsFacility {
  provider_name: string;
  provider_address: string;
  citytown: string;
  state: string;
  zip_code: string;
  telephone_number: string;
  overall_rating: string;
  health_inspection_rating: string;
  staffing_rating: string;
  qm_rating: string;
  number_of_certified_beds: string;
  provider_type: string;
  ownership_type: string;
  abuse_icon: string;
  number_of_fines: string;
  total_amount_of_fines_in_dollars: string;
  total_nursing_staff_turnover: string;
  latitude: string;
  longitude: string;
}

export interface FacilityResult {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  overallRating: number;
  healthInspectionRating: number;
  staffingRating: number;
  qmRating: number;
  beds: number;
  providerType: string;
  ownershipType: string;
  hasAbuseIcon: boolean;
  fineCount: number;
  totalFines: number;
  staffTurnover: number | null;
  distance: number; // miles from search point
  latitude: number;
  longitude: number;
}

// --- In-memory cache (per state, 24hr TTL) ---

interface CacheEntry {
  data: CmsFacility[];
  fetchedAt: number;
}

const stateCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchFacilitiesByState(
  state: string
): Promise<CmsFacility[]> {
  const key = state.toUpperCase();
  const cached = stateCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const body = {
    conditions: [{ property: "state", value: key, operator: "=" }],
    properties: CMS_FIELDS,
    limit: 5000,
    offset: 0,
  };

  const res = await fetch(CMS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`CMS API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const results: CmsFacility[] = json.results ?? [];

  stateCache.set(key, { data: results, fetchedAt: Date.now() });
  return results;
}

// --- Haversine distance (miles) ---

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Zip-based approximate geocoding from cached data ---

export function getCoordinatesForZip(
  zip: string,
  stateFacilities: CmsFacility[]
): { lat: number; lng: number } | null {
  const match = stateFacilities.find(
    (f) => f.zip_code?.substring(0, 5) === zip.substring(0, 5)
  );
  if (!match) return null;

  const lat = parseFloat(match.latitude);
  const lng = parseFloat(match.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;

  return { lat, lng };
}

// --- Normalize CMS record to client-friendly shape ---

function normalize(f: CmsFacility, distance: number): FacilityResult {
  const phone = (f.telephone_number || "").replace(/\D/g, "");
  const formatted =
    phone.length === 10
      ? `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
      : f.telephone_number || "";

  return {
    name: f.provider_name || "",
    address: f.provider_address || "",
    city: f.citytown || "",
    state: f.state || "",
    zip: f.zip_code || "",
    phone: formatted,
    overallRating: parseInt(f.overall_rating) || 0,
    healthInspectionRating: parseInt(f.health_inspection_rating) || 0,
    staffingRating: parseInt(f.staffing_rating) || 0,
    qmRating: parseInt(f.qm_rating) || 0,
    beds: parseInt(f.number_of_certified_beds) || 0,
    providerType: f.provider_type || "",
    ownershipType: f.ownership_type || "",
    hasAbuseIcon: f.abuse_icon === "Y",
    fineCount: parseInt(f.number_of_fines) || 0,
    totalFines: parseFloat(f.total_amount_of_fines_in_dollars) || 0,
    staffTurnover: f.total_nursing_staff_turnover
      ? parseFloat(f.total_nursing_staff_turnover) || null
      : null,
    distance: Math.round(distance * 10) / 10,
    latitude: parseFloat(f.latitude) || 0,
    longitude: parseFloat(f.longitude) || 0,
  };
}

// --- Main search ---

export interface SearchParams {
  state: string;
  zip?: string;
  radius?: number; // miles, default 25
  minRating?: number; // 1-5, default 1
  limit?: number; // default 20
}

export async function searchNearby(
  params: SearchParams
): Promise<{ facilities: FacilityResult[]; total: number }> {
  const { state, zip, radius = 25, minRating = 1, limit = 20 } = params;

  const facilities = await fetchFacilitiesByState(state);

  // If zip provided, compute distances; otherwise return all in state
  let centerCoords: { lat: number; lng: number } | null = null;
  if (zip) {
    centerCoords = getCoordinatesForZip(zip, facilities);
  }

  let results: FacilityResult[] = [];

  for (const f of facilities) {
    const lat = parseFloat(f.latitude);
    const lng = parseFloat(f.longitude);
    if (isNaN(lat) || isNaN(lng)) continue;

    const rating = parseInt(f.overall_rating) || 0;
    if (rating < minRating) continue;

    let dist = 0;
    if (centerCoords) {
      dist = haversineDistance(centerCoords.lat, centerCoords.lng, lat, lng);
      if (dist > radius) continue;
    }

    results.push(normalize(f, dist));
  }

  // Sort by distance (nearest first)
  results.sort((a, b) => a.distance - b.distance);

  const total = results.length;
  results = results.slice(0, limit);

  return { facilities: results, total };
}
