import type { Map as MapLibreMap } from "maplibre-gl";

/** Hide commercial/label noise on OpenFreeMap Liberty without washing out the basemap. */
const HIDDEN_LAYERS = [
  "poi_r20",
  "poi_r7",
  "poi_r1",
  "poi_transit",
  "highway-name-path",
  "highway-name-minor",
  "highway-shield-non-us",
  "highway-shield-us-interstate",
  "road_shield_us",
  "airport",
  "label_other",
  "label_village",
  "aeroway_fill",
  "aeroway_runway",
  "aeroway_taxiway",
  "building-3d",
  "road_one_way_arrow",
  "road_one_way_arrow_opposite",
];

const MUTED_LABELS = [
  "highway-name-major",
  "label_town",
  "label_city",
  "label_city_capital",
  "label_state",
  "water_name_point_label",
  "water_name_line_label",
  "waterway_line_label",
];

function setPaint(
  map: MapLibreMap,
  layerId: string,
  property: Parameters<MapLibreMap["setPaintProperty"]>[1],
  value: Parameters<MapLibreMap["setPaintProperty"]>[2]
) {
  if (!map.getLayer(layerId)) return;
  try {
    map.setPaintProperty(layerId, property, value);
  } catch {
    // Layer exists but does not support this paint property.
  }
}

export function applyExplorerMapStyle(map: MapLibreMap) {
  for (const layerId of HIDDEN_LAYERS) {
    if (!map.getLayer(layerId)) continue;
    map.setLayoutProperty(layerId, "visibility", "none");
  }

  // Soft editorial wash — keep enough contrast to read roads / water / land.
  setPaint(map, "background", "background-color", "#ebe6db");
  setPaint(map, "park", "fill-color", "#d5e0d4");
  setPaint(map, "landcover_wood", "fill-color", "#c9d6c4");
  setPaint(map, "landcover_grass", "fill-color", "#d8e2d0");
  setPaint(map, "water", "fill-color", "#b7c8c8");
  setPaint(map, "landuse_residential", "fill-color", "#e8e2d6");
  setPaint(map, "building", "fill-color", "#d4cdc0");
  setPaint(map, "building", "fill-opacity", 0.55);

  setPaint(map, "road_minor", "line-color", "#cfc6b6");
  setPaint(map, "road_secondary_tertiary", "line-color", "#c4bba9");
  setPaint(map, "road_trunk_primary", "line-color", "#b8ae9b");
  setPaint(map, "road_motorway", "line-color", "#a89c88");

  for (const layerId of MUTED_LABELS) {
    setPaint(map, layerId, "text-color", "#5f584e");
    setPaint(map, layerId, "text-halo-color", "#ebe6db");
    setPaint(map, layerId, "text-halo-width", 1.4);
    setPaint(
      map,
      layerId,
      "text-opacity",
      layerId.startsWith("label_city") || layerId === "label_state" ? 0.85 : 0.55
    );
  }
}
