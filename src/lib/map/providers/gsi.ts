import type { MapProviderConfig } from "@/lib/map/providers/types";
import { MAP_LAND_COLOR } from "@/lib/map/providers/types";

/** Stable Japan raster fallback — 国土地理院 pale. */
export const GSI_PALE_STYLE_URL = "/geo/raster-basemap.json";

export function createGsiPaleProvider(): MapProviderConfig {
  return {
    id: "gsi-pale",
    label: "GSI pale raster (fallback)",
    styleUrl: GSI_PALE_STYLE_URL,
    maxZoom: 18,
    type: "raster",
    supportsCustomStyle: false,
    landColor: MAP_LAND_COLOR,
  };
}
