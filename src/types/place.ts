export type PlaceCategory =
  | "museum"
  | "art_museum"
  | "aquarium"
  | "zoo"
  | "park"
  | "garden"
  | "shrine"
  | "temple"
  | "castle"
  | "landmark"
  | "observation"
  | "bookstore"
  | "memorial"
  | "street"
  | "cafe"
  | "restaurant"
  | "theme_park"
  | "nature"
  | "cinema"
  | "other";

export type PlaceSourceType = "curated" | "imported" | "custom";

export interface Place {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  image: string;
  regionId: string | null;
  importance: number;
  minZoom: number;
  sourceType: PlaceSourceType;
}

export interface ExploreLayerSummary {
  id: string;
  name: string;
}

export interface PlaceWithStatus extends Place {
  status: import("./user").UserPlaceStatus | null;
  rating: number | null;
  note: string | null;
  layers: ExploreLayerSummary[];
  visits: import("./user").Visit[];
  photos: import("./user").Photo[];
  exploreNote?: string | null;
}
