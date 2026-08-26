import { pointInFeature, type RegionFeature } from "@/lib/geo/regions";

export interface ChomeFeature {
  type: "Feature";
  properties: {
    id: string;
    wardId: string;
    parentId: string | null;
    type: "chome";
  };
  geometry: GeoJSON.Polygon;
}

let chomeCache: ChomeFeature[] | null = null;

export async function loadTokyoChomeFeatures(): Promise<ChomeFeature[]> {
  if (chomeCache) return chomeCache;
  const res = await fetch("/geo/tokyo-chome.json");
  if (!res.ok) throw new Error("Failed to load tokyo-chome.json");
  const data = (await res.json()) as GeoJSON.FeatureCollection;
  chomeCache = data.features as ChomeFeature[];
  return chomeCache;
}

export function findChomeAtPoint(
  lng: number,
  lat: number,
  chomes: ChomeFeature[]
): ChomeFeature | null {
  for (const chome of chomes) {
    if (pointInFeature(lng, lat, chome as unknown as RegionFeature)) return chome;
  }
  return null;
}

export function assignPlaceToChomeId(
  lng: number,
  lat: number,
  chomes: ChomeFeature[]
): string | null {
  return findChomeAtPoint(lng, lat, chomes)?.properties.id ?? null;
}
