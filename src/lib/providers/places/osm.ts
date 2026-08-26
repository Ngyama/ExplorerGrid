import {
  isExploreWorthyCategory,
  mapOsmTagsToCategory,
} from "@/lib/places/osmCategoryMap";
import type { ExternalPlaceCandidate } from "@/lib/providers/places/types";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function elementCoords(el: OverpassElement): { lat: number; lon: number } | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lon: el.lon };
  }
  if (el.center) return { lat: el.center.lat, lon: el.center.lon };
  return null;
}

function toCandidate(el: OverpassElement): ExternalPlaceCandidate | null {
  const tags = el.tags ?? {};
  const name = tags.name ?? tags["name:ja"] ?? tags["name:en"];
  if (!name) return null;
  const coords = elementCoords(el);
  if (!coords) return null;
  const category = mapOsmTagsToCategory(tags);
  if (!isExploreWorthyCategory(category)) return null;

  return {
    provider: "osm",
    externalId: `${el.type}/${el.id}`,
    name,
    latitude: coords.lat,
    longitude: coords.lon,
    category,
    description: tags.description ?? tags["description:en"] ?? "",
    rawMetadata: { type: el.type, id: el.id, tags },
    sourceUpdatedAt: new Date().toISOString(),
  };
}

async function postOverpass(query: string): Promise<OverpassElement[]> {
  let lastError: Error | null = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status} from ${endpoint}`);
        continue;
      }
      const json = (await res.json()) as { elements?: OverpassElement[] };
      return json.elements ?? [];
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error("Overpass unavailable");
}

/** Search Japan-wide by name (Nominatim-style via Overpass name regex). */
export async function searchOsmByName(
  query: string,
  limit = 12
): Promise<ExternalPlaceCandidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const escaped = q.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  const overpass = `
[out:json][timeout:45];
area["ISO3166-1"="JP"][admin_level=2]->.jp;
(
  node["name"~"${escaped}",i](area.jp);
  way["name"~"${escaped}",i](area.jp);
  node["name:en"~"${escaped}",i](area.jp);
  way["name:en"~"${escaped}",i](area.jp);
);
out center ${Math.min(limit * 4, 40)};
`;

  const elements = await postOverpass(overpass);
  const seen = new Set<string>();
  const results: ExternalPlaceCandidate[] = [];
  for (const el of elements) {
    const candidate = toCandidate(el);
    if (!candidate) continue;
    if (seen.has(candidate.externalId)) continue;
    seen.add(candidate.externalId);
    results.push(candidate);
    if (results.length >= limit) break;
  }
  return results;
}

/** Fetch curated tourism POIs inside a bbox (south,west,north,east). */
export async function fetchOsmTourismInBbox(
  bbox: [number, number, number, number],
  limit = 200
): Promise<ExternalPlaceCandidate[]> {
  const [south, west, north, east] = bbox;
  const overpass = `
[out:json][timeout:60];
(
  node["tourism"~"museum|gallery|aquarium|zoo|attraction|theme_park|viewpoint"](${south},${west},${north},${east});
  way["tourism"~"museum|gallery|aquarium|zoo|attraction|theme_park|viewpoint"](${south},${west},${north},${east});
  node["historic"~"castle|memorial|monument|shrine|temple"](${south},${west},${north},${east});
  way["historic"~"castle|memorial|monument|shrine|temple"](${south},${west},${north},${east});
  node["leisure"="park"]["name"](${south},${west},${north},${east});
  way["leisure"="park"]["name"](${south},${west},${north},${east});
  node["amenity"="place_of_worship"]["religion"~"shinto|buddhist"](${south},${west},${north},${east});
  way["amenity"="place_of_worship"]["religion"~"shinto|buddhist"](${south},${west},${north},${east});
);
out center ${limit};
`;

  const elements = await postOverpass(overpass);
  const seen = new Set<string>();
  const results: ExternalPlaceCandidate[] = [];
  for (const el of elements) {
    const candidate = toCandidate(el);
    if (!candidate) continue;
    if (seen.has(candidate.externalId)) continue;
    seen.add(candidate.externalId);
    results.push(candidate);
  }
  return results;
}

export const osmProvider = {
  id: "osm" as const,
  searchByName: searchOsmByName,
  fetchTourismInBbox: fetchOsmTourismInBbox,
};
