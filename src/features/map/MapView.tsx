"use client";

import { useEffect, useRef } from "react";
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
import type { MapPlaceMarker } from "@/types/explore";

const TOKYO_CENTER: [number, number] = [139.7671, 35.6812];
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const FIT_PADDING = { top: 100, bottom: 210, left: 36, right: 56 };

interface MapViewProps {
  places: MapPlaceMarker[];
  onPlaceClick: (placeId: string) => void;
}

function fitToPlaces(map: MapLibreMap, places: MapPlaceMarker[]) {
  if (places.length === 0) return;

  const bounds = new LngLatBounds();
  for (const place of places) {
    bounds.extend([place.longitude, place.latitude]);
  }

  map.fitBounds(bounds, {
    padding: FIT_PADDING,
    maxZoom: 12.6,
    duration: 850,
    essential: true,
  });
}

export function MapView({ places, onPlaceClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const onPlaceClickRef = useRef(onPlaceClick);
  const placesRef = useRef(places);

  useEffect(() => {
    onPlaceClickRef.current = onPlaceClick;
  }, [onPlaceClick]);

  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: TOKYO_CENTER,
      zoom: 11.1,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      touchPitch: false,
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      applyExplorerMapStyle(map);
      fitToPlaces(map, placesRef.current);
    });

    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const sorted = [...places].sort((a, b) => {
      const rank = (status: MapPlaceMarker["status"]) =>
        status === "visited" ? 2 : status === "want_to_go" ? 1 : 0;
      return rank(a.status) - rank(b.status);
    });

    sorted.forEach((place) => {
      const el = createPlaceMarkerElement(place);
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        onPlaceClickRef.current(place.id);
      });

      const marker = new Marker({ element: el, anchor: "center" })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (map.isStyleLoaded() && places.length > 0) {
      fitToPlaces(map, places);
    }
  }, [places]);

  return (
    <div
      ref={containerRef}
      className="eg-map-canvas absolute inset-0 h-full w-full"
    />
  );
}
