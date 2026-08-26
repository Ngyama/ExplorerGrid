export type MapProviderId =
  | "maptiler-japan"
  | "gsi-pale"
  | "openfreemap-liberty"
  | "custom";

export type MapProviderType = "vector" | "raster";

export interface MapProviderConfig {
  id: MapProviderId;
  label: string;
  styleUrl: string;
  maxZoom: number;
  type: MapProviderType;
  supportsCustomStyle: boolean;
  /** Soft land color for container / loading backdrop. */
  landColor: string;
}

export const MAP_LAND_COLOR = "#e8e4da";

export const LOCAL_IDEOGRAPH_FONT_FAMILY =
  '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", "Meiryo", sans-serif';
