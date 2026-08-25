export type RegionType = "country" | "prefecture" | "municipality" | "ward";

export interface Region {
  id: string;
  name: string;
  nameJa: string;
  type: RegionType;
  parentId: string | null;
  /** Prefer nameJa for Japanese UI. */
  label: string;
  /** Approximate bbox [west, south, east, north] for camera framing. */
  bbox?: [number, number, number, number];
}

export interface RegionPathItem {
  id: string;
  label: string;
  type: RegionType;
  bbox?: [number, number, number, number];
}

export interface CategoryExploreStat {
  category: string;
  label: string;
  total: number;
  visited: number;
}

export interface RegionExploreSummary {
  region: Region;
  path: RegionPathItem[];
  layerId: string | null;
  layerName: string | null;
  categories: CategoryExploreStat[];
  placeCount: number;
  visitedCount: number;
}
