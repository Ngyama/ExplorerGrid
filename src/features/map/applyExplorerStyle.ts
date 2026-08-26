import type { Map as MapLibreMap } from "maplibre-gl";

/**
 * ExplorerGrid cartographic mute for MapTiler / OpenFreeMap vector styles.
 * Goal: quiet editorial basemap — Place nodes stay the visual lead.
 */

const HIDDEN_ID_PATTERNS = [
  /poi/i,
  /amenity/i,
  /shop/i,
  /housenumber/i,
  /building-3d/i,
  /one.?way/i,
  /highway.?shield/i,
  /road.?shield/i,
  /airport.?label/i,
  /transit.?label/i,
  /bus/i,
  /parking/i,
  /atm/i,
];

const LAND = "#e8e4da";
const WATER = "#c9d4dc";
const PARK = "#d9e0d4";
const BUILDING = "#ddd6c8";
const ROAD_MINOR = "#d4cdc0";
const ROAD_MAJOR = "#c4b9a8";
const RAIL = "#b0a697";
const BOUNDARY = "rgba(90, 78, 64, 0.28)";
const LABEL = "rgba(70, 62, 52, 0.72)";
const LABEL_HALO = "rgba(232, 228, 218, 0.85)";

function shouldHideLayer(id: string, layerType: string): boolean {
  if (HIDDEN_ID_PATTERNS.some((re) => re.test(id))) return true;
  // Hide generic commercial POI symbols; keep place/admin/station labels selectively.
  if (layerType === "symbol" && /^(poi|amenity|shop)/i.test(id)) return true;
  return false;
}

function setPaint(
  map: MapLibreMap,
  layerId: string,
  prop: string,
  value: unknown
) {
  try {
    if (!map.getLayer(layerId)) return;
    map.setPaintProperty(
      layerId,
      prop as Parameters<MapLibreMap["setPaintProperty"]>[1],
      value as never
    );
  } catch {
    // Property may be unsupported on this layer.
  }
}

function setLayout(
  map: MapLibreMap,
  layerId: string,
  prop: string,
  value: unknown
) {
  try {
    if (!map.getLayer(layerId)) return;
    map.setLayoutProperty(
      layerId,
      prop as Parameters<MapLibreMap["setLayoutProperty"]>[1],
      value as never
    );
  } catch {
    // ignore
  }
}

export function applyExplorerBasemapStyle(map: MapLibreMap) {
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    const id = layer.id;
    const type = layer.type;

    if (shouldHideLayer(id, type)) {
      setLayout(map, id, "visibility", "none");
      continue;
    }

    if (type === "background") {
      setPaint(map, id, "background-color", LAND);
      continue;
    }

    if (type === "fill") {
      if (/water|ocean|river|lake/i.test(id)) {
        setPaint(map, id, "fill-color", WATER);
        setPaint(map, id, "fill-opacity", 0.9);
      } else if (/park|wood|forest|grass|landcover|landuse.*grass|green/i.test(id)) {
        setPaint(map, id, "fill-color", PARK);
        setPaint(map, id, "fill-opacity", 0.55);
      } else if (/building/i.test(id)) {
        setPaint(map, id, "fill-color", BUILDING);
        setPaint(map, id, "fill-opacity", 0.45);
      } else if (/land|earth|sand|residential|industrial/i.test(id)) {
        setPaint(map, id, "fill-color", LAND);
      }
      continue;
    }

    if (type === "line") {
      if (/rail|transit|subway|train/i.test(id)) {
        setPaint(map, id, "line-color", RAIL);
        setPaint(map, id, "line-opacity", 0.7);
        setPaint(map, id, "line-width", [
          "interpolate",
          ["linear"],
          ["zoom"],
          8,
          0.6,
          14,
          1.4,
        ]);
      } else if (/boundary|admin|border/i.test(id)) {
        setPaint(map, id, "line-color", BOUNDARY);
        setPaint(map, id, "line-width", 0.6);
        setPaint(map, id, "line-opacity", 0.5);
      } else if (/motorway|trunk|primary|highway/i.test(id)) {
        setPaint(map, id, "line-color", ROAD_MAJOR);
        setPaint(map, id, "line-opacity", 0.85);
      } else if (/road|street|path|track|secondary|tertiary|residential/i.test(id)) {
        setPaint(map, id, "line-color", ROAD_MINOR);
        setPaint(map, id, "line-opacity", 0.45);
        // Soften minor roads further at mid zoom.
        if (/path|track|service|minor|residential/i.test(id)) {
          setPaint(map, id, "line-opacity", 0.28);
        }
      }
      continue;
    }

    if (type === "symbol") {
      // Keep place / admin / station names; quiet everything else.
      const keep =
        /place|settlement|city|town|village|suburb|neighbour|admin|state|country|prefecture|station|rail/i.test(
          id
        );
      if (!keep && /road|street|highway|path/i.test(id)) {
        // Drop most road labels — Place names own the map.
        setLayout(map, id, "visibility", "none");
        continue;
      }
      setPaint(map, id, "text-color", LABEL);
      setPaint(map, id, "text-halo-color", LABEL_HALO);
      setPaint(map, id, "text-halo-width", 1.2);
      setPaint(map, id, "text-opacity", keep ? 0.78 : 0.45);
      try {
        const size = map.getLayoutProperty(id, "text-size");
        if (typeof size === "number") {
          setLayout(map, id, "text-size", Math.max(10, size * 0.9));
        }
      } catch {
        // ignore
      }
    }
  }
}

/** @deprecated alias */
export const applyExplorerMapStyle = applyExplorerBasemapStyle;
