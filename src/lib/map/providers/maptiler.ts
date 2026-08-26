import type { MapProviderConfig } from "@/lib/map/providers/types";
import { MAP_LAND_COLOR } from "@/lib/map/providers/types";

/** MapTiler Japan (MIERUNE Streets) — requires NEXT_PUBLIC_MAPTILER_KEY. */
export const MAPTILER_JAPAN_MAP_ID = "jp-mierune-streets";

export function getMapTilerKey(): string | null {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
  return key || null;
}

export function buildMapTilerJapanStyleUrl(key: string): string {
  return `https://api.maptiler.com/maps/${MAPTILER_JAPAN_MAP_ID}/style.json?key=${encodeURIComponent(key)}`;
}

export function createMapTilerJapanProvider(
  key: string
): MapProviderConfig {
  return {
    id: "maptiler-japan",
    label: "MapTiler Japan (MIERUNE)",
    styleUrl: buildMapTilerJapanStyleUrl(key),
    maxZoom: 18,
    type: "vector",
    supportsCustomStyle: true,
    landColor: MAP_LAND_COLOR,
  };
}
