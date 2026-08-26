/**
 * Provider-agnostic external place candidate.
 * Adapters (OSM, Wikidata, …) normalize into this shape.
 */
export interface ExternalPlaceCandidate {
  provider: string;
  externalId: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  description?: string;
  rawMetadata?: Record<string, unknown>;
  sourceUpdatedAt?: string;
}

export interface PlaceSearchHit {
  kind: "place" | "external";
  placeId?: string;
  external?: ExternalPlaceCandidate;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  regionId?: string | null;
}
