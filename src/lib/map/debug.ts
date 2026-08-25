"use client";

import type { Map as MapLibreMap, MapSourceDataEvent } from "maplibre-gl";
import { isMapDebugEnabled } from "@/lib/map/config";

type TileStat = {
  url: string;
  status?: number;
  size?: number;
  transferSize?: number;
};

/**
 * Attach verbose MapLibre + Resource Timing listeners for basemap diagnosis.
 * Enable with NEXT_PUBLIC_MAP_DEBUG=1.
 */
export function attachMapDebugListeners(map: MapLibreMap) {
  if (!isMapDebugEnabled() || typeof window === "undefined") {
    return () => undefined;
  }

  const log = (...args: unknown[]) => {
    console.info("[map-debug]", ...args);
  };

  const onError = (event: { error?: Error | { message?: string }; sourceId?: string }) => {
    console.error("[map-debug] error", {
      sourceId: event.sourceId,
      message:
        event.error instanceof Error
          ? event.error.message
          : event.error?.message ?? event,
      error: event.error,
    });
  };

  const onSourceDataLoading = (event: MapSourceDataEvent) => {
    log("sourcedataloading", {
      sourceId: event.sourceId,
      tile: event.tile?.tileID?.canonical,
      dataType: event.dataType,
    });
  };

  const onSourceData = (event: MapSourceDataEvent) => {
    log("sourcedata", {
      sourceId: event.sourceId,
      tile: event.tile?.tileID?.canonical,
      isSourceLoaded: event.isSourceLoaded,
      dataType: event.dataType,
    });
  };

  const onData = (event: { dataType?: string; sourceId?: string }) => {
    if (event.dataType === "style" || event.dataType === "source") {
      log("data", event);
    }
  };

  const onMoveEnd = () => {
    const center = map.getCenter();
    log("camera", {
      zoom: map.getZoom(),
      lng: center.lng,
      lat: center.lat,
      maxZoom: map.getMaxZoom(),
    });
    summarizeTileResources();
  };

  map.on("error", onError);
  map.on("sourcedataloading", onSourceDataLoading);
  map.on("sourcedata", onSourceData);
  map.on("data", onData);
  map.on("moveend", onMoveEnd);

  log("debug listeners attached", {
    style: map.getStyle()?.name,
    maxZoom: map.getMaxZoom(),
    collectResourceTiming: true,
  });

  return () => {
    map.off("error", onError);
    map.off("sourcedataloading", onSourceDataLoading);
    map.off("sourcedata", onSourceData);
    map.off("data", onData);
    map.off("moveend", onMoveEnd);
  };
}

function summarizeTileResources() {
  if (typeof performance === "undefined" || !performance.getEntriesByType) {
    return;
  }

  const entries = performance.getEntriesByType(
    "resource"
  ) as PerformanceResourceTiming[];

  const tiles = entries
    .filter((entry) => /\.pbf(\?|$)/i.test(entry.name) || /\/\d+\/\d+\/\d+/.test(entry.name))
    .slice(-40)
    .map((entry) => {
      const stat: TileStat = {
        url: entry.name,
        transferSize: entry.transferSize,
        size: entry.decodedBodySize || entry.encodedBodySize,
      };
      return stat;
    });

  const empty = tiles.filter((t) => (t.size ?? t.transferSize ?? 1) === 0);
  console.info("[map-debug] recent tile resources", {
    count: tiles.length,
    emptyCount: empty.length,
    emptySample: empty.slice(0, 8),
    sample: tiles.slice(-8),
  });
}
