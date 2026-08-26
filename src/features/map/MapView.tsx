"use client";

import "@/lib/map/maplibreSetup";
import { useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map,
  NavigationControl,
  Popup,
  type GeoJSONSource,
  type Map as MapLibreMap,
  type MapLayerMouseEvent,
  type MapGeoJSONFeature,
} from "maplibre-gl";
import { applyExplorerBasemapStyle } from "@/features/map/applyExplorerStyle";
import {
  ensureConquestLayers,
  ensurePrefectureOutlineLayers,
  EG_PREF_FILL,
  movePlaceLayersToTop,
  setConquestLayerData,
} from "@/features/map/conquestLayers";
import {
  getActiveMapProvider,
  getMapLandColor,
  isMapDebugEnabled,
  LOCAL_IDEOGRAPH_FONT_FAMILY,
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
  conquestChomeGeoJSON?: GeoJSON.FeatureCollection | null;
  conquestWardGeoJSON?: GeoJSON.FeatureCollection | null;
  onPlaceClick: (placeId: string) => void;
  onCameraChange?: (camera: MapCameraState) => void;
  onMapReady?: (map: MapLibreMap) => void;
  flyToBounds?: [number, number, number, number] | null;
  flyKey?: number;
  flyTo?: { lng: number; lat: number; zoom?: number } | null;
  flyToKey?: number;
  onContextAddPlace?: (lng: number, lat: number) => void;
}

export const EG_PLACES_SOURCE = "eg-places";
export const EG_CLUSTER_LAYER = "eg-clusters";
export const EG_CLUSTER_COUNT = "eg-cluster-count";
export const EG_POINT_LAYER = "eg-unclustered";
export const EG_POINT_HALO = "eg-unclustered-halo";

/** Status colors aligned with brand tokens in globals.css */
const COLOR_UNVISITED = "#6b7a6e";
const COLOR_WANT = "#3b6ea5";
const COLOR_VISITED = "#c45c26";
const COLOR_STROKE = "#f3efe6";
const COLOR_CLUSTER = "#5a5046";

/**
 * Client density filter so clusters only include places visible at current zoom.
 * importance: 1 national, 2 regional, 3 local
 */
function filterPlacesForZoom(
  places: MapPlaceMarker[],
  zoom: number
): MapPlaceMarker[] {
  return places.filter((place) => {
    const importance = place.importance ?? 3;
    const minZoom = place.minZoom ?? 10;
    if (zoom + 0.01 < minZoom) return false;
    if (zoom < 7 && importance > 1) return false;
    if (zoom < 9 && importance > 2) return false;
    return true;
  });
}

function placesToGeoJSON(
  places: MapPlaceMarker[]
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      id: place.id,
      geometry: {
        type: "Point",
        coordinates: [place.longitude, place.latitude],
      },
      properties: {
        id: place.id,
        name: place.name,
        category: place.category,
        status: place.status ?? "none",
        importance: place.importance ?? 3,
        minZoom: place.minZoom ?? 10,
      },
    })),
  };
}

function ensurePlaceLayers(map: MapLibreMap) {
  if (map.getSource(EG_PLACES_SOURCE)) return;

  map.addSource(EG_PLACES_SOURCE, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    promoteId: "id",
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 42,
  });

  map.addLayer({
    id: EG_CLUSTER_LAYER,
    type: "circle",
    source: EG_PLACES_SOURCE,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": COLOR_CLUSTER,
      "circle-radius": [
        "step",
        ["get", "point_count"],
        12,
        10,
        15,
        30,
        18,
      ],
      "circle-opacity": 0.82,
      "circle-stroke-width": 1.25,
      "circle-stroke-color": COLOR_STROKE,
    },
  });

  map.addLayer({
    id: EG_POINT_HALO,
    type: "circle",
    source: EG_PLACES_SOURCE,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        16,
        0,
      ],
      "circle-color": "transparent",
      "circle-stroke-width": 2.5,
      "circle-stroke-color": COLOR_VISITED,
      "circle-opacity": 0.9,
    },
  });

  map.addLayer({
    id: EG_POINT_LAYER,
    type: "circle",
    source: EG_PLACES_SOURCE,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          7,
          5,
        ],
        12,
        [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          10,
          7.5,
        ],
        16,
        [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          12,
          9,
        ],
      ],
      "circle-color": [
        "match",
        ["get", "status"],
        "visited",
        COLOR_VISITED,
        "want_to_go",
        COLOR_WANT,
        COLOR_UNVISITED,
      ],
      "circle-opacity": [
        "case",
        ["boolean", ["feature-state", "dim"], false],
        0.22,
        ["boolean", ["feature-state", "hover"], false],
        1,
        0.92,
      ],
      "circle-stroke-width": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        2.5,
        1.25,
      ],
      "circle-stroke-color": COLOR_STROKE,
    },
  });
}

function syncFeatureStates(
  map: MapLibreMap,
  places: MapPlaceMarker[],
  selectedPlaceId: string | null | undefined,
  highlightedCategory: string | null | undefined,
  prevSelectedRef: { current: string | null }
) {
  if (prevSelectedRef.current && prevSelectedRef.current !== selectedPlaceId) {
    try {
      map.setFeatureState(
        { source: EG_PLACES_SOURCE, id: prevSelectedRef.current },
        { selected: false }
      );
    } catch {
      // feature may be gone
    }
  }
  if (selectedPlaceId) {
    try {
      map.setFeatureState(
        { source: EG_PLACES_SOURCE, id: selectedPlaceId },
        { selected: true }
      );
    } catch {
      // ignore
    }
  }
  prevSelectedRef.current = selectedPlaceId ?? null;

  for (const place of places) {
    const dim = Boolean(
      highlightedCategory && place.category !== highlightedCategory
    );
    try {
      map.setFeatureState(
        { source: EG_PLACES_SOURCE, id: place.id },
        { dim }
      );
    } catch {
      // ignore
    }
  }
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
  conquestChomeGeoJSON,
  conquestWardGeoJSON,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const hoverIdRef = useRef<string | null>(null);
  const prevSelectedRef = useRef<string | null>(null);
  const placesSigRef = useRef<string>("");
  const placesRef = useRef(places);
  const selectedRef = useRef(selectedPlaceId);
  const categoryRef = useRef(highlightedCategory);
  const onPlaceClickRef = useRef(onPlaceClick);
  const onCameraChangeRef = useRef(onCameraChange);
  const onContextAddPlaceRef = useRef(onContextAddPlace);
  const [mapError, setMapError] = useState<string | null>(null);
  const [styleReady, setStyleReady] = useState(false);
  const [booting, setBooting] = useState(true);

  const landColor = getMapLandColor();

  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  useEffect(() => {
    selectedRef.current = selectedPlaceId;
  }, [selectedPlaceId]);

  useEffect(() => {
    categoryRef.current = highlightedCategory;
  }, [highlightedCategory]);

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

    let cancelled = false;
    let map: MapLibreMap | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    let detachDebug = () => {};

    const initMap = () => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const provider = getActiveMapProvider();
      const maxZoom = provider.maxZoom;
      const initialZoom = Math.min(
        initialCamera?.zoom ?? JAPAN_DEFAULT_ZOOM,
        maxZoom
      );
      const mapStyle = provider.inlineStyle ?? provider.styleUrl;

      map = new Map({
        container: containerRef.current,
        style: mapStyle,
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
        localIdeographFontFamily: LOCAL_IDEOGRAPH_FONT_FAMILY,
        cancelPendingTileRequestsWhileZooming: false,
        collectResourceTiming: isMapDebugEnabled(),
        fadeDuration: 0,
      });

      mapRef.current = map;
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      detachDebug = attachMapDebugListeners(map);

      popupRef.current = new Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
        className: "eg-map-tooltip",
        maxWidth: "220px",
      });

      if (typeof ResizeObserver !== "undefined" && containerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          map?.resize();
        });
        resizeObserver.observe(containerRef.current);
      }

      map.on("error", (event) => {
        const message =
          event.error instanceof Error
            ? event.error.message
            : String(event.error ?? "Unknown map error");
        if (/glyph|sprite|404|Failed to fetch/i.test(message)) {
          console.warn("[ExplorerGrid map]", message);
          return;
        }
        console.error("[ExplorerGrid map]", event.error ?? event);
        setMapError(message);
      });

      let setupPromise: Promise<void> | null = null;
      const setupLayers = () => {
        if (!map || cancelled || mapRef.current !== map) return;
        if (!map.isStyleLoaded()) return;
        if (map.getLayer(EG_PREF_FILL)) {
          setStyleReady(true);
          setBooting(false);
          map.resize();
          return;
        }
        if (setupPromise) return;

        setupPromise = (async () => {
          try {
            if (cancelled || mapRef.current !== map) return;
            if (shouldApplyExplorerStyleMute(provider)) {
              applyExplorerBasemapStyle(map);
            }
            await ensurePrefectureOutlineLayers(map);
            if (cancelled || mapRef.current !== map) return;
            ensureConquestLayers(map);
            ensurePlaceLayers(map);
            movePlaceLayersToTop(map);
            setStyleReady(true);
            setBooting(false);
            setMapError(null);
            map.resize();
            onMapReady?.(map);
          } catch (err) {
            console.error("[ExplorerGrid map] layer setup failed", err);
            if (!cancelled && mapRef.current === map) {
              setMapError(
                err instanceof Error ? err.message : "地图图层初始化失败"
              );
              setBooting(false);
            }
          } finally {
            setupPromise = null;
          }
        })();
      };

      map.once("load", setupLayers);
      map.on("styledata", setupLayers);
      map.once("idle", () => {
        map?.resize();
        setupLayers();
      });
      if (map.isStyleLoaded()) {
        setupLayers();
      }

      map.on("click", EG_CLUSTER_LAYER, (event) => {
        const features = map!.queryRenderedFeatures(event.point, {
          layers: [EG_CLUSTER_LAYER],
        });
        const feature = features[0];
        const clusterId = feature?.properties?.cluster_id;
        const source = map!.getSource(EG_PLACES_SOURCE) as
          | GeoJSONSource
          | undefined;
        if (clusterId == null || !source) return;
        void source.getClusterExpansionZoom(clusterId).then((zoom) => {
          if (zoom == null) return;
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [
            number,
            number,
          ];
          map!.easeTo({ center: coords, zoom });
        });
      });

      map.on("click", EG_POINT_LAYER, (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const id = feature?.properties?.id ?? feature?.id;
        if (typeof id === "string") onPlaceClickRef.current(id);
      });

      const setHover = (feature: MapGeoJSONFeature | undefined) => {
        const id = (feature?.properties?.id ?? feature?.id) as
          | string
          | undefined;
        if (hoverIdRef.current && hoverIdRef.current !== id) {
          try {
            map!.setFeatureState(
              { source: EG_PLACES_SOURCE, id: hoverIdRef.current },
              { hover: false }
            );
          } catch {
            // ignore
          }
          hoverIdRef.current = null;
        }
        if (id) {
          try {
            map!.setFeatureState(
              { source: EG_PLACES_SOURCE, id },
              { hover: true }
            );
          } catch {
            // ignore
          }
          hoverIdRef.current = id;
          const name = feature?.properties?.name;
          if (typeof name === "string" && feature?.geometry.type === "Point") {
            const coords = feature.geometry.coordinates as [number, number];
            popupRef.current
              ?.setLngLat(coords)
              .setHTML(
                `<div class="eg-map-tooltip__name">${name.replace(/[<>&]/g, "")}</div>`
              )
              .addTo(map!);
          }
        } else {
          popupRef.current?.remove();
        }
      };

      map.on("mousemove", EG_POINT_LAYER, (event) => {
        map!.getCanvas().style.cursor = "pointer";
        setHover(event.features?.[0]);
      });
      map.on("mouseleave", EG_POINT_LAYER, () => {
        map!.getCanvas().style.cursor = "";
        setHover(undefined);
      });
      map.on("mouseenter", EG_CLUSTER_LAYER, () => {
        map!.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", EG_CLUSTER_LAYER, () => {
        map!.getCanvas().style.cursor = "";
      });

      map.on("contextmenu", (event) => {
        event.preventDefault();
        onContextAddPlaceRef.current?.(event.lngLat.lng, event.lngLat.lat);
      });

      const pushCamera = () => {
        const center = map!.getCenter();
        onCameraChangeRef.current?.({
          lng: center.lng,
          lat: center.lat,
          zoom: map!.getZoom(),
        });
      };
      map.on("moveend", () => {
        if (moveTimer) clearTimeout(moveTimer);
        moveTimer = setTimeout(pushCamera, 200);
      });

      const pushPlacesForZoom = () => {
        const source = map!.getSource(EG_PLACES_SOURCE) as
          | GeoJSONSource
          | undefined;
        if (!source) return;
        const visible = filterPlacesForZoom(placesRef.current, map!.getZoom());
        const sig = visible
          .map((p) => `${p.id}:${p.status ?? ""}`)
          .join("|");
        if (sig !== placesSigRef.current) {
          placesSigRef.current = sig;
          source.setData(placesToGeoJSON(visible));
        }
        requestAnimationFrame(() => {
          syncFeatureStates(
            map!,
            visible,
            selectedRef.current,
            categoryRef.current,
            prevSelectedRef
          );
        });
      };
      map.on("zoomend", pushPlacesForZoom);

      requestAnimationFrame(() => map!.resize());
    };

    const frame = requestAnimationFrame(initMap);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      detachDebug();
      resizeObserver?.disconnect();
      if (moveTimer) clearTimeout(moveTimer);
      popupRef.current?.remove();
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Places GeoJSON — filter by zoom locally; no API round-trip.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    ensurePlaceLayers(map);
    const source = map.getSource(EG_PLACES_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    const visible = filterPlacesForZoom(places, map.getZoom());
    const sig = visible.map((p) => `${p.id}:${p.status ?? ""}`).join("|");
    placesSigRef.current = sig;
    source.setData(placesToGeoJSON(visible));

    requestAnimationFrame(() => {
      syncFeatureStates(
        map,
        visible,
        selectedPlaceId,
        highlightedCategory,
        prevSelectedRef
      );
    });
  }, [places, highlightedCategory, selectedPlaceId, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !conquestChomeGeoJSON || !conquestWardGeoJSON) {
      return;
    }
    setConquestLayerData(map, conquestChomeGeoJSON, conquestWardGeoJSON);
    movePlaceLayersToTop(map);
  }, [conquestChomeGeoJSON, conquestWardGeoJSON, styleReady]);

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
    <div className="absolute inset-0 min-h-0 w-full">
      <div
        ref={containerRef}
        className="eg-map-canvas absolute inset-0 min-h-0 w-full"
        style={{ background: landColor }}
      />
      {booting && (
        <div className="pointer-events-none absolute left-4 top-[7.5rem] z-10 text-xs text-[var(--muted)]">
          地图加载中
        </div>
      )}
      {mapError && (
        <div className="absolute inset-x-4 top-24 z-30 mx-auto max-w-md rounded-sm border border-red-300 bg-[#f8ece8] px-4 py-3 text-sm text-red-800">
          <div className="font-medium">Map failed to load</div>
          <div className="mt-1 opacity-90">{mapError}</div>
        </div>
      )}
    </div>
  );
}
