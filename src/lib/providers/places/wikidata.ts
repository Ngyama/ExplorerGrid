/**
 * Wikidata adapter stub — ready for future enrichment.
 * Current import uses OSM; Wikidata can attach additional PlaceExternalReference rows.
 */
import type { ExternalPlaceCandidate } from "@/lib/providers/places/types";

export async function searchWikidataByName(
  _query: string,
  _limit = 8
): Promise<ExternalPlaceCandidate[]> {
  // Intentionally empty this round — OSM covers search + import.
  return [];
}

export const wikidataProvider = {
  id: "wikidata" as const,
  searchByName: searchWikidataByName,
};
