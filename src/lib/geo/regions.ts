import type { Region, RegionPathItem, RegionType } from "@/types/region";

type Ring = [number, number][];
type Polygon = Ring[];
type MultiPolygon = Polygon[];

export interface RegionFeatureProperties {
  id: string;
  code?: string;
  name: string;
  nameJa: string;
  type: RegionType;
  parentId: string | null;
}

export interface RegionFeature {
  type: "Feature";
  properties: RegionFeatureProperties;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: Polygon | MultiPolygon;
  };
}

export interface RegionFeatureCollection {
  type: "FeatureCollection";
  features: RegionFeature[];
}

export const JAPAN_REGION: Region = {
  id: "japan",
  name: "Japan",
  nameJa: "日本",
  type: "country",
  parentId: null,
  label: "日本",
  bbox: [122.9, 24.0, 145.8, 45.6],
};

export const JAPAN_CENTER: [number, number] = [137.5, 36.5];
export const JAPAN_DEFAULT_ZOOM = 5.2;

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, polygon: Polygon): boolean {
  if (!polygon.length) return false;
  if (!pointInRing(lng, lat, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(lng, lat, polygon[i])) return false;
  }
  return true;
}

export function pointInFeature(
  lng: number,
  lat: number,
  feature: RegionFeature
): boolean {
  const { geometry } = feature;
  if (geometry.type === "Polygon") {
    return pointInPolygon(lng, lat, geometry.coordinates as Polygon);
  }
  return (geometry.coordinates as MultiPolygon).some((poly) =>
    pointInPolygon(lng, lat, poly)
  );
}

export function featureBBox(
  feature: RegionFeature
): [number, number, number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function walk(coords: unknown): void {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      minX = Math.min(minX, coords[0]);
      minY = Math.min(minY, coords[1]);
      maxX = Math.max(maxX, coords[0]);
      maxY = Math.max(maxY, coords[1]);
      return;
    }
    for (const child of coords) walk(child);
  }

  walk(feature.geometry.coordinates);
  return [minX, minY, maxX, maxY];
}

export function featureToRegion(feature: RegionFeature): Region {
  return {
    id: feature.properties.id,
    name: feature.properties.name,
    nameJa: feature.properties.nameJa,
    type: feature.properties.type,
    parentId: feature.properties.parentId,
    label: feature.properties.nameJa || feature.properties.name,
    bbox: featureBBox(feature),
  };
}

export function desiredRegionType(zoom: number): RegionType {
  if (zoom < 7.2) return "country";
  if (zoom < 10.5) return "prefecture";
  return "ward";
}

export function findRegionAtPoint(
  lng: number,
  lat: number,
  zoom: number,
  prefectures: RegionFeature[],
  wards: RegionFeature[]
): { region: Region; path: RegionPathItem[]; feature: RegionFeature | null } {
  const level = desiredRegionType(zoom);

  if (level === "country") {
    return {
      region: JAPAN_REGION,
      path: [
        {
          id: JAPAN_REGION.id,
          label: JAPAN_REGION.label,
          type: "country",
          bbox: JAPAN_REGION.bbox,
        },
      ],
      feature: null,
    };
  }

  const pref = prefectures.find((f) => pointInFeature(lng, lat, f)) ?? null;
  if (!pref) {
    return {
      region: JAPAN_REGION,
      path: [
        {
          id: JAPAN_REGION.id,
          label: JAPAN_REGION.label,
          type: "country",
          bbox: JAPAN_REGION.bbox,
        },
      ],
      feature: null,
    };
  }

  const prefRegion = featureToRegion(pref);
  const path: RegionPathItem[] = [
    {
      id: JAPAN_REGION.id,
      label: JAPAN_REGION.label,
      type: "country",
      bbox: JAPAN_REGION.bbox,
    },
    {
      id: prefRegion.id,
      label: prefRegion.label,
      type: "prefecture",
      bbox: prefRegion.bbox,
    },
  ];

  if (level === "prefecture" || pref.properties.id !== "pref-13") {
    return { region: prefRegion, path, feature: pref };
  }

  const ward = wards.find((f) => pointInFeature(lng, lat, f)) ?? null;
  if (!ward) {
    return { region: prefRegion, path, feature: pref };
  }

  const wardRegion = featureToRegion(ward);
  path.push({
    id: wardRegion.id,
    label: wardRegion.label,
    type: "ward",
    bbox: wardRegion.bbox,
  });
  return { region: wardRegion, path, feature: ward };
}

/** Regions whose places should count toward the current viewport region. */
export function regionScopeIds(region: Region): string[] {
  if (region.type === "country") return ["japan"];
  return [region.id];
}

export function regionMatchesPlace(
  placeRegionId: string | null,
  current: Region
): boolean {
  if (current.type === "country") return true;
  if (!placeRegionId) return false;
  if (placeRegionId === current.id) return true;

  if (current.type === "prefecture") {
    const prefCode = current.id.replace("pref-", "");
    return placeRegionId.startsWith(`ward-${prefCode}`);
  }

  return false;
}
