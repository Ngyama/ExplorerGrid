"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Map, NavigationControl, type Map as MapLibreMap } from "maplibre-gl";
import {
  DEFAULT_MAP_STYLE_URL,
  getMapMaxZoom,
  getMapStyleUrl,
  isOpenFreeMapStyle,
  OPENFREEMAP_LIBERTY_STYLE_URL,
  OPENFREEMAP_SOURCE_MAX_ZOOM,
} from "@/lib/map/config";
import { attachMapDebugListeners } from "@/lib/map/debug";

const TOKYO: [number, number] = [139.7671, 35.6812];

const PRESETS = [
  {
    id: "raster-gsi",
    label: "GSI pale raster (default)",
    styleUrl: DEFAULT_MAP_STYLE_URL,
    maxZoom: 18,
  },
  {
    id: "openfreemap-liberty",
    label: "OpenFreeMap Liberty (vector)",
    styleUrl: OPENFREEMAP_LIBERTY_STYLE_URL,
    maxZoom: OPENFREEMAP_SOURCE_MAX_ZOOM,
  },
  {
    id: "maplibre-demo",
    label: "MapLibre Demo Tiles",
    styleUrl: "https://demotiles.maplibre.org/style.json",
    maxZoom: 18,
  },
  {
    id: "env",
    label: "Env NEXT_PUBLIC_MAP_STYLE_URL",
    styleUrl: null as string | null,
    maxZoom: null as number | null,
  },
] as const;

/**
 * Minimal MapLibre harness — no Region, markers, or ExplorerGrid style mute.
 */
export default function MapDebugPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [presetId, setPresetId] = useState<string>("raster-gsi");
  const [zoom, setZoom] = useState(5.2);
  const [status, setStatus] = useState("booting");
  const [lastError, setLastError] = useState<string | null>(null);
  const [sourceInfo, setSourceInfo] = useState<string>("—");

  const preset = useMemo(
    () => PRESETS.find((item) => item.id === presetId) ?? PRESETS[0],
    [presetId]
  );

  const styleUrl = preset.styleUrl ?? getMapStyleUrl();
  const maxZoom = preset.maxZoom ?? getMapMaxZoom();

  useEffect(() => {
    if (!containerRef.current) return;

    setStatus("loading style");
    setLastError(null);
    setSourceInfo("—");

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new Map({
      container: containerRef.current,
      style: styleUrl,
      center: TOKYO,
      zoom: 5.2,
      minZoom: 4,
      maxZoom,
      cancelPendingTileRequestsWhileZooming: false,
      fadeDuration: 0,
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const detachDebug = attachMapDebugListeners(map);

    map.on("error", (event) => {
      const message =
        event.error instanceof Error
          ? event.error.message
          : String(event.error ?? "unknown");
      console.error("[map-debug]", event.error ?? event);
      setLastError(message);
      setStatus("error");
    });

    map.on("load", () => {
      setStatus("loaded");
      map.resize();
      const sources = map.getStyle()?.sources ?? {};
      setSourceInfo(
        Object.entries(sources)
          .map(([id, source]) => {
            const max =
              source && "maxzoom" in source ? String(source.maxzoom) : "?";
            return `${id}:${source?.type}@${max}`;
          })
          .join(" · ") || "none"
      );
    });

    map.on("move", () => setZoom(map.getZoom()));

    mapRef.current = map;
    requestAnimationFrame(() => map.resize());

    return () => {
      detachDebug();
      map.remove();
      mapRef.current = null;
    };
  }, [styleUrl, maxZoom]);

  return (
    <div className="relative h-[100dvh] w-full bg-[#e8e4da] text-[#1c1915]">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-md rounded-sm border border-[var(--line)] bg-[var(--panel)] p-3 text-xs leading-5 shadow-sm backdrop-blur-sm">
        <div className="mb-2 text-[10px] tracking-[0.16em] text-[var(--muted)]">
          MAP DEBUG
        </div>
        <label className="pointer-events-auto mb-2 block">
          <span className="text-[var(--muted)]">Style preset</span>
          <select
            className="mt-1 w-full rounded-sm border border-[var(--line)] bg-white px-2 py-1"
            value={presetId}
            onChange={(event) => setPresetId(event.target.value)}
          >
            {PRESETS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div className="break-all">style: {styleUrl}</div>
        <div>status: {status}</div>
        <div>
          zoom: {zoom.toFixed(2)} (maxZoom={maxZoom})
        </div>
        <div>sources: {sourceInfo}</div>
        <div>openfreemap?: {String(isOpenFreeMapStyle(styleUrl))}</div>
        {lastError && (
          <div className="mt-2 text-red-700">error: {lastError}</div>
        )}
        <div className="mt-2 text-[var(--muted)]">
          默认用国土地理院 pale 栅格（可放大到 z18）。可选 OpenFreeMap Liberty
          对比：vector 在 z7 后是否变空白。
        </div>
        <div className="pointer-events-auto mt-2 flex flex-wrap gap-2">
          {[4, 7, 10, 12, 14, 16, 18].map((z) => (
            <button
              key={z}
              type="button"
              className="rounded-sm border border-[var(--line)] bg-white px-2 py-1 hover:bg-[var(--accent-soft)] disabled:opacity-40"
              disabled={z > maxZoom}
              onClick={() =>
                mapRef.current?.zoomTo(Math.min(z, maxZoom), { duration: 400 })
              }
            >
              z{z}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
