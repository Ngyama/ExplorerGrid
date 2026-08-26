/** Tunable conquest thresholds — adjust without touching map code. */
export const CONQUEST_CONFIG = {
  /** Ward conquered when visited / eligible >= this ratio. */
  wardConquestRatio: 0.5,
  /** Only approved places with importance <= this count toward ward conquest. */
  wardMaxImportance: 2,
  /** Chome counts as "touched" with at least this many visited places. */
  chomeTouchedMin: 1,
  /** Chome "deep" when visited ratio >= this OR visited >= chomeDeepMinCount. */
  chomeDeepRatio: 0.5,
  chomeDeepMinCount: 2,
} as const;

export type ChomeExploreStatus = "untouched" | "touched" | "deep";

export type ChomeProgress = {
  id: string;
  wardId: string;
  visited: number;
  total: number;
  ratio: number;
  status: ChomeExploreStatus;
};

export type WardProgress = {
  wardId: string;
  visited: number;
  total: number;
  ratio: number;
  conquered: boolean;
};

export function chomeStatusFromCounts(
  visited: number,
  total: number
): ChomeExploreStatus {
  if (visited <= 0) return "untouched";
  const ratio = total > 0 ? visited / total : 0;
  if (
    ratio >= CONQUEST_CONFIG.chomeDeepRatio ||
    visited >= CONQUEST_CONFIG.chomeDeepMinCount
  ) {
    return "deep";
  }
  if (visited >= CONQUEST_CONFIG.chomeTouchedMin) return "touched";
  return "untouched";
}

export function wardConquered(visited: number, total: number): boolean {
  if (total <= 0) return false;
  return visited / total >= CONQUEST_CONFIG.wardConquestRatio;
}

/** MapLibre fill color by chome status. */
export const CHOME_FILL: Record<ChomeExploreStatus, string> = {
  untouched: "#ddd8ce",
  touched: "#e8b896",
  deep: "#c45c26",
};

export const CHOME_FILL_OPACITY: Record<ChomeExploreStatus, number> = {
  untouched: 0.55,
  touched: 0.72,
  deep: 0.88,
};
