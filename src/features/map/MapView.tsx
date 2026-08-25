"use client";

import { useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map,
  Marker,
  NavigationControl,
  type Map as MapLibreMap,
  type Marker as MapLibreMarker,
} from "maplibre-gl";
import { applyExplorerMapStyle } from "@/features/map/applyExplorerStyle";
import { createPlaceMarkerElement } from "@/features/map/createPlaceMarker";
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
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const onPlaceClickRef = useRef(onPlaceClick);
  const onCameraChangeRef = useRef(onCameraChange);
  const [mapError, setMapError] = useState<string | null>(null);
  const [styleReady, setStyleReady] = useState(false);

  useEffect(() => {
    onPlaceClickRef.current = onPlaceClick;
  }, [onPlaceClick]);

  useEffect(() => {
    onCameraChangeRef.current = onCameraChange;
  }, [onCameraChange]);

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
      // OpenFreeMap planet tiles end at z14; z15+ returns HTTP 200 with empty body.
      maxZoom,
      // Disable v6 overscale window so coveringTiles uses full source.maxzoom.
      zoomLevelsToOverscale: undefined,
      // Keep in-flight tiles while the user zooms past natural_earth (z≤7).
      cancelPendingTileRequestsWhileZooming: false,
      collectResourceTiming: isMapDebugEnabled(),
      fadeDuration: 0,
    });

    // Belt-and-suspenders: defaults merge can leave overscale=4 if undefined is dropped.
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

    const handleError = (event: { error?: Error | { message?: string } }) => {
      const message =
        event.error instanceof Error
          ? event.error.message
          : event.error?.message ?? "Unknown map error";
      console.error("[ExplorerGrid map]", event.error ?? event);
      setMapError(message);
    };

    map.on("error", handleError);

    map.on("load", () => {
      (map as unknown as { _zoomLevelsToOverscale?: number })._zoomLevelsToOverscale =
        undefined;
      if (shouldApplyExplorerStyleMute(styleUrl)) {
        applyExplorerMapStyle(map);
      }
      setStyleReady(true);
      setMapError(null);
      map.resize();
      onMapReady?.(map);

      if (isMapDebugEnabled()) {
        const sources = map.getStyle()?.sources ?? {};
        for (const [id, source] of Object.entries(sources)) {
          if (source && source.type === "vector") {
            console.info("[ExplorerGrid map] vector source", {
              id,
              maxzoom: "maxzoom" in source ? source.maxzoom : undefined,
              tiles: "tiles" in source ? source.tiles : undefined,
              url: "url" in source ? source.url : undefined,
            });
          }
        }
      }
    });

    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    const emitCamera = () => {
      const center = map.getCenter();
      onCameraChangeRef.current?.({
        lng: center.lng,
        lat: center.lat,
        zoom: map.getZoom(),
      });
    };

    map.on("moveend", () => {
      if (moveTimer) clearTimeout(moveTimer);
      moveTimer = setTimeout(emitCamera, 120);
    });

    mapRef.current = map;
    requestAnimationFrame(() => map.resize());

    return () => {
      detachDebug();
      resizeObserver?.disconnect();
      if (moveTimer) clearTimeout(moveTimer);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // initialCamera only used on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!map || !styleReady) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const sorted = [...places].sort((a, b) => {
      const rank = (status: MapPlaceMarker["status"]) =>
        status === "visited" ? 2 : status === "want_to_go" ? 1 : 0;
      return rank(a.status) - rank(b.status);
    });

    sorted.forEach((place) => {
      const el = createPlaceMarkerElement(place);
      if (highlightedCategory && place.category === highlightedCategory) {
        el.classList.add("is-highlighted");
      } else if (highlightedCategory) {
        el.classList.add("is-dimmed");
      }
      if (selectedPlaceId === place.id) {
        el.classList.add("is-selected");
      }

      el.addEventListener("click", (event) => {
        event.stopPropagation();
        onPlaceClickRef.current(place.id);
      });

      const marker = new Marker({ element: el, anchor: "center" })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [places, highlightedCategory, selectedPlaceId, styleReady]);

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
          <div className="mt-2 text-xs opacity-75">
            Check console for style / tile / WebGL errors. Open{" "}
            <code>/map-debug</code> for a minimal basemap harness.
          </div>
        </div>
      )}
    </div>
  );
}
