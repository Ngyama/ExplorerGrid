import type { StyleSpecification } from "maplibre-gl";
import { MAP_LAND_COLOR } from "@/lib/map/providers/types";

/** Inline style — avoids fetch failures for empty abstract basemap. */
export const ABSTRACT_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: "ExplorerGrid Abstract",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": MAP_LAND_COLOR,
      },
    },
  ],
};
