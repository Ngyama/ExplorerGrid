import { createGsiPaleProvider, GSI_PALE_STYLE_URL } from "@/lib/map/providers/gsi";
import {
  buildMapTilerJapanStyleUrl,
  createMapTilerJapanProvider,
  getMapTilerKey,
} from "@/lib/map/providers/maptiler";
import type { MapProviderConfig } from "@/lib/map/providers/types";
import { MAP_LAND_COLOR } from "@/lib/map/providers/types";

export const OPENFREEMAP_LIBERTY_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

const OPENFREEMAP_MAX_ZOOM = 14;

/**
 * Resolve active basemap provider.
 * Priority:
 * 1. NEXT_PUBLIC_MAP_STYLE_URL (custom override)
 * 2. MapTiler Japan + NEXT_PUBLIC_MAPTILER_KEY
 * 3. GSI pale raster fallback
 */
export function resolveMapProvider(): MapProviderConfig {
  const custom = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  if (custom) {
    const isOpenFree = custom.includes("openfreemap.org");
    const isGsi = custom.includes("raster-basemap") || custom.includes("gsi");
    const isMapTiler = custom.includes("maptiler.com");
    return {
      id: "custom",
      label: "Custom NEXT_PUBLIC_MAP_STYLE_URL",
      styleUrl: custom,
      maxZoom: Number(process.env.NEXT_PUBLIC_MAP_MAX_ZOOM) || (isOpenFree ? OPENFREEMAP_MAX_ZOOM : 18),
      type: isGsi ? "raster" : "vector",
      supportsCustomStyle: isMapTiler || isOpenFree,
      landColor: MAP_LAND_COLOR,
    };
  }

  const key = getMapTilerKey();
  if (key) {
    return createMapTilerJapanProvider(key);
  }

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    // Client-only soft hint; avoid crashing SSR.
    console.info(
      "[ExplorerGrid map] MapTiler key not configured; using GSI pale fallback."
    );
  }

  return createGsiPaleProvider();
}

export function listDebugProviders(): MapProviderConfig[] {
  const key = getMapTilerKey();
  const list: MapProviderConfig[] = [];
  if (key) {
    list.push(createMapTilerJapanProvider(key));
  } else {
    list.push({
      id: "maptiler-japan",
      label: "MapTiler Japan (set NEXT_PUBLIC_MAPTILER_KEY)",
      styleUrl: buildMapTilerJapanStyleUrl("YOUR_KEY"),
      maxZoom: 18,
      type: "vector",
      supportsCustomStyle: true,
      landColor: MAP_LAND_COLOR,
    });
  }
  list.push(createGsiPaleProvider());
  list.push({
    id: "openfreemap-liberty",
    label: "OpenFreeMap Liberty",
    styleUrl: OPENFREEMAP_LIBERTY_STYLE_URL,
    maxZoom: OPENFREEMAP_MAX_ZOOM,
    type: "vector",
    supportsCustomStyle: true,
    landColor: MAP_LAND_COLOR,
  });
  const envStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  if (envStyle) {
    list.push({
      id: "custom",
      label: "Env NEXT_PUBLIC_MAP_STYLE_URL",
      styleUrl: envStyle,
      maxZoom: Number(process.env.NEXT_PUBLIC_MAP_MAX_ZOOM) || 18,
      type: "vector",
      supportsCustomStyle: true,
      landColor: MAP_LAND_COLOR,
    });
  }
  return list;
}

export { GSI_PALE_STYLE_URL, getMapTilerKey, buildMapTilerJapanStyleUrl };
export type { MapProviderConfig };
