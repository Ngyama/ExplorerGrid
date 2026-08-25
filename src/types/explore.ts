import type { PlaceCategory } from "./place";
import type { UserPlaceStatus } from "./user";

export interface ExploreLayer {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  regionId: string | null;
  placeCount: number;
  visitedCount: number;
}

export interface ExploreLayerPlace {
  layerId: string;
  placeId: string;
  priority: number;
  order: number;
}

export interface MapPlaceMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  status: UserPlaceStatus | null;
  regionId: string | null;
  importance: number;
  minZoom: number;
}
