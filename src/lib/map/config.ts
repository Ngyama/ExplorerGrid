/**
 * Basemap provider configuration.
 *
 * Default: local MapLibre style → 国土地理院 pale **raster** tiles.
 * These load reliably past z7 (unlike OpenFreeMap Liberty, whose natural_earth
 * raster ends ~z7 and then depends on vector paint).
 *
 * OpenFreeMap / MapTiler remain available via NEXT_PUBLIC_MAP_STYLE_URL.
 */
export const DEFAULT_MAP_STYLE_URL = "/geo/raster-basemap.json";

export const OPENFREEMAP_LIBERTY_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

/** OpenFreeMap planet vector tiles stop at z14 (z15+ → HTTP 200 empty body). */
export const OPENFREEMAP_SOURCE_MAX_ZOOM = 14;

export function getMapStyleUrl(): string {
  return process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim() || DEFAULT_MAP_STYLE_URL;
}

export function isOpenFreeMapStyle(styleUrl: string = getMapStyleUrl()): boolean {
  return styleUrl.includes("openfreemap.org");
}

export function getMapMaxZoom(): number {
  const fromEnv = Number(process.env.NEXT_PUBLIC_MAP_MAX_ZOOM);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }
  if (isOpenFreeMapStyle()) {
    return OPENFREEMAP_SOURCE_MAX_ZOOM;
  }
  // GSI pale tiles go to z18.
  return 18;
}

export function isMapDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAP_DEBUG === "1";
}

export function shouldApplyExplorerStyleMute(
  styleUrl: string = getMapStyleUrl()
): boolean {
  return isOpenFreeMapStyle(styleUrl);
}
