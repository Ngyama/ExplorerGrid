"use client";

import { useEffect, useRef } from "react";
import {
  Map,
  Marker,
  NavigationControl,
  Popup,
  type Map as MapLibreMap,
  type Marker as MapLibreMarker,
} from "maplibre-gl";
import type { MapPlaceMarker } from "@/types/explore";

const TOKYO_CENTER: [number, number] = [139.7671, 35.6812];
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

function markerColor(status: MapPlaceMarker["status"]) {
  if (status === "visited") return "#c45c26";
  if (status === "want_to_go") return "#3b6ea5";
  return "#2f5d50";
}

function createMarkerElement(place: MapPlaceMarker) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "eg-marker";
  el.setAttribute("aria-label", place.name);
  el.style.cssText = `
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 2px solid #f3efe6;
    background: ${markerColor(place.status)};
    box-shadow: 0 2px 8px rgba(28,25,21,0.35);
    cursor: pointer;
    transform: ${place.status === "visited" ? "scale(1.15)" : "scale(1)"};
  `;
  return el;
}

interface MapViewProps {
  places: MapPlaceMarker[];
  onPlaceClick: (placeId: string) => void;
}

export function MapView({ places, onPlaceClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const onPlaceClickRef = useRef(onPlaceClick);

  useEffect(() => {
    onPlaceClickRef.current = onPlaceClick;
  }, [onPlaceClick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: TOKYO_CENTER,
      zoom: 11.2,
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
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

    places.forEach((place) => {
      const el = createMarkerElement(place);
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        onPlaceClickRef.current(place.id);
      });

      const marker = new Marker({ element: el })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(
          new Popup({ offset: 12, closeButton: false }).setText(place.name)
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [places]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
