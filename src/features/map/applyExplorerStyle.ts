import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * Light cleanup only — do not repaint land/water/roads to near-page colors.
 * Heavy mute previously made a failed WebGL/vector paint look like a "blank map".
 */
const HIDDEN_LAYERS = [
  "poi_r20",
  "poi_r7",
  "poi_r1",
  "poi_transit",
  "highway-shield-non-us",
  "highway-shield-us-interstate",
  "road_shield_us",
  "building-3d",
  "road_one_way_arrow",
  "road_one_way_arrow_opposite",
];

export function applyExplorerMapStyle(map: MapLibreMap) {
  for (const layerId of HIDDEN_LAYERS) {
    if (!map.getLayer(layerId)) continue;
    try {
      map.setLayoutProperty(layerId, "visibility", "none");
    } catch {
      // Layer may not support layout visibility in this style build.
    }
  }
}
