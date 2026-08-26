import type { PlaceCategory } from "@/types/place";
import { mapOsmTagsToCategory } from "@/lib/places/categoryMapping";

/** Re-export mapping for older imports */
export {
  mapOsmTagsToCategory,
  isExploreWorthyCategory,
  assertCategory,
} from "@/lib/places/categoryMapping";
export type { OsmTags } from "@/lib/places/categoryMapping";

/** importance: 1 = national, 2 = regional, 3 = local */
export function defaultMinZoomForImportance(importance: number): number {
  if (importance <= 1) return 5;
  if (importance <= 2) return 8;
  return 11;
}

const NATIONAL_NAME_HINTS = [
  "富士山",
  "東京タワー",
  "東京スカイツリー",
  "浅草寺",
  "明治神宮",
  "皇居",
  "清水寺",
  "金閣寺",
  "伏見稲荷",
  "姫路城",
  "厳島神社",
  "東大寺",
  "大阪城",
];

/**
 * Initial importance suggestion from OSM tags.
 * Always treat as a draft — humans override in Review.
 */
export function scoreImportanceFromOsm(
  tags: Record<string, string | undefined>,
  category?: PlaceCategory
): number {
  const resolved =
    category ?? mapOsmTagsToCategory(tags);
  const name = tags.name ?? tags["name:ja"] ?? "";
  const nameEn = tags["name:en"] ?? "";

  let score = 0;

  if (NATIONAL_NAME_HINTS.some((n) => name.includes(n) || nameEn.includes(n))) {
    score += 40;
  }
  if (tags.wikidata && tags.wikipedia) score += 18;
  else if (tags.wikidata || tags.wikipedia) score += 12;

  if (tags.heritage || tags["heritage:operator"]) score += 14;
  if (tags.website || tags["contact:website"]) score += 4;
  if (tags["name:en"] && tags.name) score += 3;
  if (tags.opening_hours) score += 2;
  if (tags.fee) score += 1;

  if (resolved === "castle" || resolved === "theme_park") score += 16;
  if (
    resolved === "museum" ||
    resolved === "art_museum" ||
    resolved === "aquarium" ||
    resolved === "zoo"
  ) {
    score += 10;
  }
  if (resolved === "observation" || resolved === "landmark") score += 8;
  if (resolved === "shrine" || resolved === "temple" || resolved === "garden") {
    score += 6;
  }
  if (tags.tourism === "attraction") score += 5;
  if (tags.historic) score += 4;

  // Map score → 1/2/3
  if (score >= 40) return 1;
  if (score >= 18) return 2;
  return 3;
}

/** @deprecated alias */
export const inferImportanceFromOsm = scoreImportanceFromOsm;

export function placeholderImageForCategory(category: PlaceCategory): string {
  const map: Partial<Record<PlaceCategory, string>> = {
    museum:
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
    art_museum:
      "https://images.unsplash.com/photo-1577720643272-265ad586569e?w=800&q=80",
    aquarium:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    zoo: "https://images.unsplash.com/photo-1564349683136-77e08bbd0744?w=800&q=80",
    park: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&q=80",
    garden:
      "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80",
    shrine:
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&q=80",
    temple:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    castle:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    landmark:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    observation:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
    bookstore:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    memorial:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80",
    street:
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80",
    cafe: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    restaurant:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    theme_park:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    nature:
      "https://images.unsplash.com/photo-1490806843957-31f4c9a91c8f?w=800&q=80",
  };
  return map[category] ?? "";
}

export function buildNeutralDescription(input: {
  name: string;
  category: PlaceCategory;
  regionLabel?: string | null;
}): string {
  const where = input.regionLabel ? `位于${input.regionLabel}的` : "";
  const kind: Record<string, string> = {
    museum: "博物馆",
    art_museum: "美术馆",
    aquarium: "水族馆",
    zoo: "动物园",
    park: "公园",
    garden: "庭园",
    shrine: "神社",
    temple: "寺院",
    castle: "城郭",
    landmark: "地标",
    observation: "展望设施",
    bookstore: "书店",
    memorial: "纪念场所",
    street: "街区",
    cafe: "咖啡馆",
    restaurant: "餐厅",
    theme_park: "主题乐园",
    nature: "自然景点",
    cinema: "影院",
    other: "地点",
  };
  return `${where}${kind[input.category] ?? "地点"}「${input.name}」。`;
}
