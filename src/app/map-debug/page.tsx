"use client";

import "@/lib/map/maplibreSetup";
import { useEffect, useMemo, useRef, useState } from "react";
import { Map, NavigationControl, type Map as MapLibreMap } from "maplibre-gl";
import { applyExplorerBasemapStyle } from "@/features/map/applyExplorerStyle";
import {
  getActiveMapProvider,
  listDebugProviders,
  LOCAL_IDEOGRAPH_FONT_FAMILY,
  MAP_LAND_COLOR,
} from "@/lib/map/config";
import { attachMapDebugListeners } from "@/lib/map/debug";
import type { MapProviderConfig } from "@/lib/map/providers/types";

const TOKYO: [number, number] = [139.7671, 35.6812];

/**
 * Minimal MapLibre harness — compare MapTiler Japan / GSI / custom styles.
 */
export default function MapDebugPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const providers = useMemo(() => listDebugProviders(), []);
  const active = useMemo(() => getActiveMapProvider(), []);
  const [presetId, setPresetId] = useState<string>(active.id);
  const [zoom, setZoom] = useState(5.2);
  const [status, setStatus] = useState("booting");
  const [lastError, setLastError] = useState<string | null>(null);
  const [sourceInfo, setSourceInfo] = useState<string>("—");
  const [applyMute, setApplyMute] = useState(true);

  const preset: MapProviderConfig =
    providers.find((item) => item.id === presetId) ?? providers[0] ?? active;

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
      style: preset.styleUrl,
      center: TOKYO,
      zoom: 5.2,
      minZoom: 4,
      maxZoom: preset.maxZoom,
      localIdeographFontFamily: LOCAL_IDEOGRAPH_FONT_FAMILY,
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
      if (applyMute && preset.supportsCustomStyle) {
        applyExplorerBasemapStyle(map);
      }
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
  }, [preset.styleUrl, preset.maxZoom, preset.supportsCustomStyle, applyMute]);

  return (
    <div
      className="relative h-[100dvh] w-full text-[#1c1915]"
      style={{ background: MAP_LAND_COLOR }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        style={{ background: MAP_LAND_COLOR }}
      />

      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-md rounded-sm border border-[var(--line)] bg-[var(--panel)] p-3 text-xs leading-5 shadow-sm backdrop-blur-sm">
        <div className="mb-2 text-[10px] tracking-[0.16em] text-[var(--muted)]">
          MAP DEBUG
        </div>
        <label className="pointer-events-auto mb-2 block">
          <span className="text-[var(--muted)]">Provider</span>
          <select
            className="mt-1 w-full rounded-sm border border-[var(--line)] bg-white px-2 py-1"
            value={presetId}
            onChange={(event) => setPresetId(event.target.value)}
          >
            {providers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="pointer-events-auto mb-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={applyMute}
            onChange={(e) => setApplyMute(e.target.checked)}
          />
          ExplorerGrid style mute
        </label>
        <div>provider: {preset.id}</div>
        <div className="break-all">style: {preset.styleUrl}</div>
        <div>type: {preset.type}</div>
        <div>status: {status}</div>
        <div>
          zoom: {zoom.toFixed(2)} (maxZoom={preset.maxZoom})
        </div>
        <div>sources: {sourceInfo}</div>
        {lastError && (
          <div className="mt-2 text-red-700">error: {lastError}</div>
        )}
        <div className="mt-2 text-[var(--muted)]">
          优先 MapTiler Japan（需 NEXT_PUBLIC_MAPTILER_KEY）；无 key 时回退
          GSI pale。对比 z5–z18 加载与标签密度。
        </div>
        <div className="pointer-events-auto mt-2 flex flex-wrap gap-2">
          {[5, 8, 10, 12, 14, 16, 18].map((z) => (
            <button
              key={z}
              type="button"
              className="rounded-sm border border-[var(--line)] bg-white px-2 py-1 hover:bg-[var(--accent-soft)] disabled:opacity-40"
              disabled={z > preset.maxZoom}
              onClick={() =>
                mapRef.current?.zoomTo(Math.min(z, preset.maxZoom), {
                  duration: 400,
                })
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
