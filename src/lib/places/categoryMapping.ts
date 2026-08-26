import type { PlaceCategory } from "@/types/place";
import { isPlaceCategory } from "@/lib/categories";

export type OsmTags = Record<string, string | undefined>;

/**
 * Declarative OSM tag → ExplorerGrid category mapping.
 * First matching rule wins. Unknown → other (never guess).
 */
type MappingRule = {
  id: string;
  match: (tags: OsmTags) => boolean;
  category: PlaceCategory;
};

const RULES: MappingRule[] = [
  {
    id: "art-museum",
    category: "art_museum",
    match: (t) =>
      t.tourism === "gallery" ||
      t.amenity === "arts_centre" ||
      (t.tourism === "museum" &&
        (t.museum === "art" || t.subject === "art" || t["museum:type"] === "art")),
  },
  {
    id: "museum",
    category: "museum",
    match: (t) => t.tourism === "museum",
  },
  {
    id: "aquarium",
    category: "aquarium",
    match: (t) => t.tourism === "aquarium",
  },
  {
    id: "zoo",
    category: "zoo",
    match: (t) => t.tourism === "zoo",
  },
  {
    id: "theme-park",
    category: "theme_park",
    match: (t) => t.tourism === "theme_park",
  },
  {
    id: "observation",
    category: "observation",
    match: (t) =>
      t.tourism === "viewpoint" ||
      t.man_made === "tower" ||
      t.man_made === "observatory" ||
      t.man_made === "communications_tower",
  },
  {
    id: "castle",
    category: "castle",
    match: (t) => t.historic === "castle" || t.historic === "castle_wall",
  },
  {
    id: "memorial",
    category: "memorial",
    match: (t) =>
      t.historic === "memorial" ||
      t.historic === "monument" ||
      t.historic === "wayside_shrine",
  },
  {
    id: "shrine",
    category: "shrine",
    match: (t) =>
      t.historic === "shrine" ||
      (t.amenity === "place_of_worship" && t.religion === "shinto"),
  },
  {
    id: "temple",
    category: "temple",
    match: (t) =>
      t.historic === "temple" ||
      (t.amenity === "place_of_worship" && t.religion === "buddhist"),
  },
  {
    id: "garden",
    category: "garden",
    match: (t) => t.leisure === "garden" || t.tourism === "garden",
  },
  {
    id: "park",
    category: "park",
    match: (t) => t.leisure === "park" || t.leisure === "nature_reserve",
  },
  {
    id: "nature",
    category: "nature",
    match: (t) =>
      t.natural === "peak" ||
      t.natural === "volcano" ||
      t.natural === "wood" ||
      t.natural === "beach",
  },
  {
    id: "bookstore",
    category: "bookstore",
    match: (t) => t.shop === "books",
  },
  {
    id: "cafe",
    category: "cafe",
    match: (t) => t.amenity === "cafe",
  },
  {
    id: "restaurant",
    category: "restaurant",
    match: (t) => t.amenity === "restaurant" || t.amenity === "fast_food",
  },
  {
    id: "cinema",
    category: "cinema",
    match: (t) => t.amenity === "cinema",
  },
  {
    id: "landmark-attraction",
    category: "landmark",
    match: (t) =>
      t.tourism === "attraction" ||
      t.tourism === "yes" ||
      t.tourism === "artwork" ||
      t.historic === "yes",
  },
  {
    id: "noise",
    category: "other",
    match: (t) =>
      t.amenity === "atm" ||
      t.amenity === "parking" ||
      t.amenity === "toilets" ||
      t.amenity === "vending_machine" ||
      t.amenity === "bench" ||
      t.shop === "convenience",
  },
];

export function mapOsmTagsToCategory(tags: OsmTags): PlaceCategory {
  for (const rule of RULES) {
    if (rule.match(tags)) return rule.category;
  }
  return "other";
}

export function isExploreWorthyCategory(category: PlaceCategory): boolean {
  return category !== "other";
}

export function assertCategory(value: string): PlaceCategory {
  return isPlaceCategory(value) ? value : "other";
}

/** @deprecated use categoryMapping — kept for import paths */
export { mapOsmTagsToCategory as mapOsmTagsToCategoryLegacy };
