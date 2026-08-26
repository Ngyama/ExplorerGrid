import type { PlaceCategory } from "@/types/place";

export interface ExploreLayer {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  regionId: string | null;
  type: "curated" | "dynamic" | "user";
  visibility: "public" | "private";
  placeCount: number;
  visitedCount: number;
}

export interface ExploreLayerPlace {
  layerId: string;
  placeId: string;
  priority: number;
  order: number;
  note: string | null;
}

export interface MapPlaceMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  status: import("./user").UserPlaceStatus | null;
  regionId: string | null;
  importance: number;
  minZoom: number;
}

export interface CollectionSummary {
  id: string;
  name: string;
  description: string;
  placeCount: number;
  createdAt: string;
}

export type MapContentMode = "explore" | "collection";
