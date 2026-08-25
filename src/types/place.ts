import type { Photo, UserPlaceStatus, Visit } from "./user";

export type PlaceCategory =
  | "museum"
  | "restaurant"
  | "cafe"
  | "landmark"
  | "park"
  | "shrine"
  | "cinema"
  | "street"
  | "bookstore"
  | "memorial";

export interface Place {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  image: string;
}

export interface ExploreLayerSummary {
  id: string;
  name: string;
}

export interface PlaceWithStatus extends Place {
  status: UserPlaceStatus | null;
  rating: number | null;
  note: string | null;
  layers: ExploreLayerSummary[];
  visits: Visit[];
  photos: Photo[];
}
