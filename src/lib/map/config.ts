import {
  resolveMapProvider,
  GSI_PALE_STYLE_URL,
  OPENFREEMAP_LIBERTY_STYLE_URL,
  listDebugProviders,
  getMapTilerKey,
} from "@/lib/map/providers";
import type { MapProviderConfig } from "@/lib/map/providers/types";
import {
  LOCAL_IDEOGRAPH_FONT_FAMILY,
  MAP_LAND_COLOR,
} from "@/lib/map/providers/types";

/** @deprecated Use resolveMapProvider().styleUrl — kept for older imports. */
export const DEFAULT_MAP_STYLE_URL = GSI_PALE_STYLE_URL;

export {
  OPENFREEMAP_LIBERTY_STYLE_URL,
  GSI_PALE_STYLE_URL,
  listDebugProviders,
  getMapTilerKey,
  LOCAL_IDEOGRAPH_FONT_FAMILY,
  MAP_LAND_COLOR,
};

export const OPENFREEMAP_SOURCE_MAX_ZOOM = 14;

export function getActiveMapProvider(): MapProviderConfig {
  return resolveMapProvider();
}

export function getMapStyleUrl(): string {
  return resolveMapProvider().styleUrl;
}

export function getMapMaxZoom(): number {
  const fromEnv = Number(process.env.NEXT_PUBLIC_MAP_MAX_ZOOM);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  return resolveMapProvider().maxZoom;
}

export function getMapLandColor(): string {
  return resolveMapProvider().landColor || MAP_LAND_COLOR;
}

export function isOpenFreeMapStyle(styleUrl: string = getMapStyleUrl()): boolean {
  return styleUrl.includes("openfreemap.org");
}

export function isMapTilerStyle(styleUrl: string = getMapStyleUrl()): boolean {
  return styleUrl.includes("maptiler.com");
}

export function isMapDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAP_DEBUG === "1";
}

/** Apply ExplorerGrid cartographic mute when the provider supports it. */
export function shouldApplyExplorerStyleMute(
  provider: MapProviderConfig = resolveMapProvider()
): boolean {
  return provider.supportsCustomStyle;
}
