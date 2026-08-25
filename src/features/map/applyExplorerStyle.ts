import type { Map as MapLibreMap } from "maplibre-gl";

const HIDDEN_LAYERS = [
  "highway-name-path",
  "highway-name-minor",
  "highway-shield-non-us",
  "highway-shield-us-interstate",
  "road_shield_us",
  "airport",
  "label_other",
  "label_village",
  "aeroway-taxiway",
  "aeroway-runway-casing",
  "aeroway-area",
  "aeroway-runway",
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

  setPaint(map, "background", "background-color", "#e4dfd2");
  setPaint(map, "park", "fill-color", "#d4ddd0");
  setPaint(map, "landcover_wood", "fill-color", "#cfd8ca");
  setPaint(map, "water", "fill-color", "#c5d0cb");
  setPaint(map, "landuse_residential", "fill-color", "#e7e2d5");
  setPaint(map, "building", "fill-color", "#d8d1c3");
  setPaint(map, "building", "fill-opacity", 0.4);
  setPaint(map, "highway_path", "line-color", "#d5cfc2");
  setPaint(map, "highway_minor", "line-color", "#d0cabd");
  setPaint(map, "highway_major_casing", "line-color", "#cfc8ba");
  setPaint(map, "highway_major_inner", "line-color", "#e6e0d3");
  setPaint(map, "highway_major_subtle", "line-color", "#ddd6c8");

  for (const layerId of MUTED_LABELS) {
    setPaint(map, layerId, "text-color", "#6e675c");
    setPaint(map, layerId, "text-halo-color", "#e4dfd2");
    setPaint(map, layerId, "text-halo-width", 1.2);
    setPaint(map, layerId, "text-opacity", layerId.startsWith("label_city") ? 0.78 : 0.48);
    setPaint(map, layerId, "icon-opacity", 0.35);
  }
}
