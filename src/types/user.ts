export type UserPlaceStatus = "want_to_go" | "visited";

export const LOCAL_USER_ID = "local";

export interface UserPlace {
  userId: string;
  placeId: string;
  status: UserPlaceStatus;
  rating: number | null;
  note: string | null;
}

export interface Visit {
  id: string;
  userId: string;
  placeId: string;
  visitedAt: string;
  note: string | null;
}

export interface Photo {
  id: string;
  userId: string;
  placeId: string;
  visitId: string | null;
  url: string;
  createdAt: string;
}

export interface GridPlaceItem {
  id: string;
  name: string;
  status: UserPlaceStatus | null;
}

export interface GridLayerGroup {
  layerId: string;
  layerName: string;
  places: GridPlaceItem[];
}
