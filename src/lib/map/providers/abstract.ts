import type { MapProviderConfig } from "@/lib/map/providers/types";
import { MAP_LAND_COLOR } from "@/lib/map/providers/types";
import { ABSTRACT_MAP_STYLE } from "@/lib/map/providers/abstractStyle";

export const ABSTRACT_BASEMAP_STYLE_URL = "/geo/abstract-basemap.json";

export function createAbstractBasemapProvider(): MapProviderConfig {
  return {
    id: "abstract",
    label: "ExplorerGrid Abstract",
    styleUrl: ABSTRACT_BASEMAP_STYLE_URL,
    inlineStyle: ABSTRACT_MAP_STYLE,
    maxZoom: 18,
    type: "vector",
    supportsCustomStyle: false,
    landColor: MAP_LAND_COLOR,
  };
}
