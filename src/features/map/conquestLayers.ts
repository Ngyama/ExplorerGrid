import type { Map as MapLibreMap } from "maplibre-gl";
import {
  CHOME_FILL,
  CHOME_FILL_OPACITY,
  type ChomeExploreStatus,
} from "@/lib/map/conquest";

let prefecturesPromise: Promise<GeoJSON.FeatureCollection> | null = null;

function loadPrefecturesGeo(): Promise<GeoJSON.FeatureCollection> {
  if (!prefecturesPromise) {
    prefecturesPromise = fetch("/geo/prefectures.json").then((res) => {
      if (!res.ok) throw new Error(`prefectures.json ${res.status}`);
      return res.json() as Promise<GeoJSON.FeatureCollection>;
    });
  }
  return prefecturesPromise;
}

export const EG_CHOME_SOURCE = "eg-chomes";
export const EG_CHOME_FILL = "eg-chome-fill";
export const EG_WARD_SOURCE = "eg-wards";
export const EG_WARD_FILL = "eg-ward-fill";
export const EG_WARD_LINE = "eg-ward-line";
export const EG_PREF_SOURCE = "eg-prefectures";
export const EG_PREF_FILL = "eg-prefecture-fill";
export const EG_PREF_LINE = "eg-prefecture-line";

/** Chome micro-grid visible at ward-level zoom and above. */
export const CONQUEST_CHOME_MIN_ZOOM = 10.5;

const COLOR_WARD_FOG = "#d5cfc4";
const COLOR_WARD_MID = "#ddb896";
const COLOR_WARD_DONE = "#c45c26";
const COLOR_OUTLINE = "#a89f92";
const COLOR_OUTLINE_CONQUERED = "#8a3d12";

function statusColor(status: string): string {
  return CHOME_FILL[status as ChomeExploreStatus] ?? CHOME_FILL.untouched;
}

function statusOpacity(status: string): number {
  return CHOME_FILL_OPACITY[status as ChomeExploreStatus] ?? 0.55;
}

export function ensureConquestLayers(map: MapLibreMap) {
  if (!map.getSource(EG_CHOME_SOURCE)) {
    map.addSource(EG_CHOME_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      promoteId: "id",
    });
  }

  if (!map.getSource(EG_WARD_SOURCE)) {
    map.addSource(EG_WARD_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      promoteId: "id",
    });
  }

  if (!map.getLayer(EG_WARD_FILL)) {
    map.addLayer({
      id: EG_WARD_FILL,
      type: "fill",
      source: EG_WARD_SOURCE,
      minzoom: 9,
      maxzoom: CONQUEST_CHOME_MIN_ZOOM,
      paint: {
        "fill-color": [
          "case",
          ["==", ["get", "conquered"], 1],
          COLOR_WARD_DONE,
          [">", ["get", "ratio"], 0],
          COLOR_WARD_MID,
          COLOR_WARD_FOG,
        ],
        "fill-opacity": [
          "case",
          ["==", ["get", "conquered"], 1],
          0.42,
          [">", ["get", "ratio"], 0],
          0.28,
          0.18,
        ],
      },
    });
  }

  if (!map.getLayer(EG_CHOME_FILL)) {
    map.addLayer({
      id: EG_CHOME_FILL,
      type: "fill",
      source: EG_CHOME_SOURCE,
      minzoom: CONQUEST_CHOME_MIN_ZOOM,
      paint: {
        "fill-color": [
          "match",
          ["get", "status"],
          "deep",
          statusColor("deep"),
          "touched",
          statusColor("touched"),
          statusColor("untouched"),
        ],
        "fill-opacity": [
          "match",
          ["get", "status"],
          "deep",
          statusOpacity("deep"),
          "touched",
          statusOpacity("touched"),
          statusOpacity("untouched"),
        ],
      },
    });
  }

  if (!map.getLayer(EG_WARD_LINE)) {
    map.addLayer({
      id: EG_WARD_LINE,
      type: "line",
      source: EG_WARD_SOURCE,
      minzoom: 9,
      paint: {
        "line-color": [
          "case",
          ["==", ["get", "conquered"], 1],
          COLOR_OUTLINE_CONQUERED,
          COLOR_OUTLINE,
        ],
        "line-width": [
          "case",
          ["==", ["get", "conquered"], 1],
          2.4,
          1.2,
        ],
        "line-opacity": 0.85,
      },
    });
  }
}

export async function ensurePrefectureOutlineLayers(map: MapLibreMap) {
  const prefectures = await loadPrefecturesGeo();
  if (!map.getSource(EG_PREF_SOURCE)) {
    map.addSource(EG_PREF_SOURCE, {
      type: "geojson",
      data: prefectures,
    });
  } else {
    const source = map.getSource(EG_PREF_SOURCE);
    if (source && "setData" in source) {
      (source as { setData: (d: GeoJSON.FeatureCollection) => void }).setData(
        prefectures
      );
    }
  }

  if (!map.getLayer(EG_PREF_FILL)) {
    map.addLayer({
      id: EG_PREF_FILL,
      type: "fill",
      source: EG_PREF_SOURCE,
      maxzoom: 9.5,
      paint: {
        "fill-color": "#b8ad9c",
        "fill-opacity": 0.88,
      },
    });
  }

  if (!map.getLayer(EG_PREF_LINE)) {
    map.addLayer({
      id: EG_PREF_LINE,
      type: "line",
      source: EG_PREF_SOURCE,
      maxzoom: 9.5,
      paint: {
        "line-color": "#6b6256",
        "line-width": 1.5,
        "line-opacity": 0.95,
      },
    });
  }
}

export function setConquestLayerData(
  map: MapLibreMap,
  chomeGeoJSON: GeoJSON.FeatureCollection,
  wardGeoJSON: GeoJSON.FeatureCollection
) {
  ensureConquestLayers(map);
  const chomeSource = map.getSource(EG_CHOME_SOURCE);
  const wardSource = map.getSource(EG_WARD_SOURCE);
  if (chomeSource && "setData" in chomeSource) {
    (chomeSource as { setData: (d: GeoJSON.FeatureCollection) => void }).setData(
      chomeGeoJSON
    );
  }
  if (wardSource && "setData" in wardSource) {
    (wardSource as { setData: (d: GeoJSON.FeatureCollection) => void }).setData(
      wardGeoJSON
    );
  }
}

/** Place markers render above conquest fills. */
export function movePlaceLayersToTop(map: MapLibreMap) {
  const layers = [
    "eg-clusters",
    "eg-unclustered",
    "eg-unclustered-halo",
  ];
  for (const id of layers) {
    if (map.getLayer(id)) {
      try {
        map.moveLayer(id);
      } catch {
        // ignore
      }
    }
  }
}
