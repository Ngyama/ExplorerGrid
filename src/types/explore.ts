export interface ExploreLayer {
  id: string;
  name: string;
  description: string;
  coverImage: string;
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
  category: string;
  status: "want_to_go" | "visited" | null;
}
