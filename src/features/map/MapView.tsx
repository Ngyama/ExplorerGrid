"use client";

import { useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map,
  NavigationControl,
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapLayerMouseEvent,
} from "maplibre-gl";
import { applyExplorerMapStyle } from "@/features/map/applyExplorerStyle";
import {
  getMapMaxZoom,
  getMapStyleUrl,
  isMapDebugEnabled,
  shouldApplyExplorerStyleMute,
} from "@/lib/map/config";
import { attachMapDebugListeners } from "@/lib/map/debug";
import {
  JAPAN_CENTER,
  JAPAN_DEFAULT_ZOOM,
} from "@/lib/geo/regions";
import type { MapPlaceMarker } from "@/types/explore";

export interface MapCameraState {
  lng: number;
  lat: number;
  zoom: number;
}

interface MapViewProps {
  places: MapPlaceMarker[];
  highlightedCategory?: string | null;
  selectedPlaceId?: string | null;
  initialCamera?: Partial<MapCameraState>;
  onPlaceClick: (placeId: string) => void;
  onCameraChange?: (camera: MapCameraState) => void;
  onMapReady?: (map: MapLibreMap) => void;
  flyToBounds?: [number, number, number, number] | null;
  flyKey?: number;
  flyTo?: { lng: number; lat: number; zoom?: number } | null;
  flyToKey?: number;
  onContextAddPlace?: (lng: number, lat: number) => void;
}

const SOURCE_ID = "eg-places";
const CLUSTER_LAYER = "eg-clusters";
const CLUSTER_COUNT = "eg-cluster-count";
const POINT_LAYER = "eg-unclustered";

function placesToGeoJSON(
  places: MapPlaceMarker[],
  highlightedCategory: string | null | undefined,
  selectedPlaceId: string | null | undefined
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map((place) => {
      let dim = 0;
      if (highlightedCategory) {
        dim = place.category === highlightedCategory ? 0 : 1;
      }
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [place.longitude, place.latitude],
        },
        properties: {
          id: place.id,
          name: place.name,
          category: place.category,
          status: place.status ?? "none",
          importance: place.importance,
          dim,
          selected: place.id === selectedPlaceId ? 1 : 0,
        },
      };
    }),
  };
}

function ensurePlaceLayers(map: MapLibreMap) {
  if (map.getSource(SOURCE_ID)) return;

  map.addSource(SOURCE_ID, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 48,
  });

  map.addLayer({
    id: CLUSTER_LAYER,
    type: "circle",
    source: SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#5c4a3a",
      "circle-radius": [
        "step",
        ["get", "point_count"],
        16,
        8,
        20,
        25,
        26,
      ],
      "circle-opacity": 0.88,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#f3efe6",
    },
  });

  map.addLayer({
    id: CLUSTER_COUNT,
    type: "symbol",
    source: SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 12,
    },
    paint: {
      "text-color": "#f7f3ea",
    },
  });

  map.addLayer({
    id: POINT_LAYER,
    type: "circle",
    source: SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": [
        "case",
        ["==", ["get", "selected"], 1],
        11,
        8,
      ],
      "circle-color": [
        "match",
        ["get", "status"],
        "visited",
        "#2f6b4f",
        "want_to_go",
        "#c45c26",
        "#6b5a48",
      ],
      "circle-opacity": [
        "case",
        ["==", ["get", "dim"], 1],
        0.28,
        0.92,
      ],
      "circle-stroke-width": [
        "case",
        ["==", ["get", "selected"], 1],
        3,
        1.5,
      ],
      "circle-stroke-color": "#f3efe6",
    },
  });
}

export function MapView({
  places,
  highlightedCategory,
  selectedPlaceId,
  initialCamera,
  onPlaceClick,
  onCameraChange,
  onMapReady,
  flyToBounds,
  flyKey = 0,
  flyTo,
  flyToKey = 0,
  onContextAddPlace,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onPlaceClickRef = useRef(onPlaceClick);
  const onCameraChangeRef = useRef(onCameraChange);
  const onContextAddPlaceRef = useRef(onContextAddPlace);
  const [mapError, setMapError] = useState<string | null>(null);
  const [styleReady, setStyleReady] = useState(false);

  useEffect(() => {
    onPlaceClickRef.current = onPlaceClick;
  }, [onPlaceClick]);

  useEffect(() => {
    onCameraChangeRef.current = onCameraChange;
  }, [onCameraChange]);

  useEffect(() => {
    onContextAddPlaceRef.current = onContextAddPlace;
  }, [onContextAddPlace]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const styleUrl = getMapStyleUrl();
    const maxZoom = getMapMaxZoom();
    const initialZoom = Math.min(
      initialCamera?.zoom ?? JAPAN_DEFAULT_ZOOM,
      maxZoom
    );

    const map = new Map({
      container: containerRef.current,
      style: styleUrl,
      center: [
        initialCamera?.lng ?? JAPAN_CENTER[0],
        initialCamera?.lat ?? JAPAN_CENTER[1],
      ],
      zoom: initialZoom,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      touchPitch: false,
      maxBounds: [
        [122, 20],
        [154, 48],
      ],
      minZoom: 4,
      maxZoom,
      zoomLevelsToOverscale: undefined,
      cancelPendingTileRequestsWhileZooming: false,
      collectResourceTiming: isMapDebugEnabled(),
      fadeDuration: 0,
    });

    (map as unknown as { _zoomLevelsToOverscale?: number })._zoomLevelsToOverscale =
      undefined;

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const detachDebug = attachMapDebugListeners(map);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            map.resize();
          })
        : null;
    if (containerRef.current && resizeObserver) {
      resizeObserver.observe(containerRef.current);
    }

    map.on("error", (event) => {
      const message =
        event.error instanceof Error
          ? event.error.message
          : String(event.error ?? "Unknown map error");
      console.error("[ExplorerGrid map]", event.error ?? event);
      setMapError(message);
    });

    map.on("load", () => {
      (map as unknown as { _zoomLevelsToOverscale?: number })._zoomLevelsToOverscale =
        undefined;
      if (shouldApplyExplorerStyleMute(styleUrl)) {
        applyExplorerMapStyle(map);
      }
      ensurePlaceLayers(map);
      setStyleReady(true);
      setMapError(null);
      map.resize();
      onMapReady?.(map);
    });

    map.on("click", CLUSTER_LAYER, (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: [CLUSTER_LAYER],
      });
      const feature = features[0];
      const clusterId = feature?.properties?.cluster_id;
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
      if (clusterId == null || !source) return;
      void source.getClusterExpansionZoom(clusterId).then((zoom) => {
        if (zoom == null) return;
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [
          number,
          number,
        ];
        map.easeTo({ center: coords, zoom });
      });
    });

    map.on("click", POINT_LAYER, (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const id = feature?.properties?.id;
      if (typeof id === "string") onPlaceClickRef.current(id);
    });

    map.on("mouseenter", CLUSTER_LAYER, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", CLUSTER_LAYER, () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("mouseenter", POINT_LAYER, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", POINT_LAYER, () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("contextmenu", (event) => {
      event.preventDefault();
      onContextAddPlaceRef.current?.(event.lngLat.lng, event.lngLat.lat);
    });

    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    map.on("moveend", () => {
      if (moveTimer) clearTimeout(moveTimer);
      moveTimer = setTimeout(() => {
        const center = map.getCenter();
        onCameraChangeRef.current?.({
          lng: center.lng,
          lat: center.lat,
          zoom: map.getZoom(),
        });
      }, 120);
    });

    mapRef.current = map;
    requestAnimationFrame(() => map.resize());

    return () => {
      detachDebug();
      resizeObserver?.disconnect();
      if (moveTimer) clearTimeout(moveTimer);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    ensurePlaceLayers(map);
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return;
    source.setData(
      placesToGeoJSON(places, highlightedCategory, selectedPlaceId)
    );
  }, [places, highlightedCategory, selectedPlaceId, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToBounds) return;
    const bounds = new LngLatBounds(
      [flyToBounds[0], flyToBounds[1]],
      [flyToBounds[2], flyToBounds[3]]
    );
    map.fitBounds(bounds, {
      padding: { top: 100, bottom: 180, left: 40, right: 320 },
      duration: 900,
      maxZoom: Math.min(
        map.getMaxZoom(),
        flyToBounds[2] - flyToBounds[0] > 8 ? 5.5 : 12.5
      ),
    });
  }, [flyToBounds, flyKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTo) return;
    map.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? Math.max(map.getZoom(), 13),
      duration: 800,
    });
  }, [flyTo, flyToKey]);

  return (
    <div className="absolute inset-0 h-full w-full">
      <div
        ref={containerRef}
        className="eg-map-canvas absolute inset-0 h-full w-full"
      />
      {mapError && (
        <div className="absolute inset-x-4 top-24 z-30 mx-auto max-w-md rounded-sm border border-red-300 bg-[#f8ece8] px-4 py-3 text-sm text-red-800">
          <div className="font-medium">Map failed to load</div>
          <div className="mt-1 opacity-90">{mapError}</div>
        </div>
      )}
    </div>
  );
}
