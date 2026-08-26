import { osmProvider } from "@/lib/providers/places/osm";
import { wikidataProvider } from "@/lib/providers/places/wikidata";
import type { ExternalPlaceCandidate } from "@/lib/providers/places/types";

export type PlacesProviderId = "osm" | "wikidata";

const providers = {
  osm: osmProvider,
  wikidata: wikidataProvider,
} as const;

export function getPlacesProvider(id: PlacesProviderId = "osm") {
  return providers[id];
}

export async function searchExternalPlaces(
  query: string,
  limit = 10
): Promise<ExternalPlaceCandidate[]> {
  try {
    return await osmProvider.searchByName(query, limit);
  } catch (err) {
    console.warn("[places provider] OSM search failed", err);
    return [];
  }
}

export type { ExternalPlaceCandidate };
