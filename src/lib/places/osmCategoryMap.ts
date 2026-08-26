import type { PlaceCategory } from "@/types/place";
import { isPlaceCategory } from "@/lib/categories";

export type OsmTags = Record<string, string | undefined>;

/**
 * Map OSM tags → ExplorerGrid category.
 * Prefer specific tourism/historic tags; fall back to amenity/leisure.
 * Unknown → other (never guess).
 */
export function mapOsmTagsToCategory(tags: OsmTags): PlaceCategory {
  const tourism = tags.tourism;
  const historic = tags.historic;
  const amenity = tags.amenity;
  const leisure = tags.leisure;
  const shop = tags.shop;
  const manMade = tags.man_made;
  const natural = tags.natural;
  const religion = tags.religion;

  if (tourism === "museum") {
    if (tags.museum === "art" || tags.subject === "art") return "art_museum";
    return "museum";
  }
  if (tourism === "gallery" || amenity === "arts_centre") return "art_museum";
  if (tourism === "aquarium") return "aquarium";
  if (tourism === "zoo") return "zoo";
  if (tourism === "theme_park") return "theme_park";
  if (tourism === "viewpoint" || manMade === "tower" || manMade === "observatory") {
    return "observation";
  }
  if (
    tourism === "attraction" ||
    tourism === "yes" ||
    tourism === "artwork"
  ) {
    return "landmark";
  }

  if (historic === "castle" || historic === "castle_wall") return "castle";
  if (historic === "memorial" || historic === "monument") return "memorial";
  if (historic === "shrine" || (religion === "shinto" && amenity === "place_of_worship")) {
    return "shrine";
  }
  if (
    historic === "temple" ||
    (religion === "buddhist" && amenity === "place_of_worship")
  ) {
    return "temple";
  }
  if (amenity === "place_of_worship") {
    if (religion === "shinto") return "shrine";
    if (religion === "buddhist") return "temple";
    return "other";
  }

  if (leisure === "park" || leisure === "nature_reserve") return "park";
  if (leisure === "garden" || tourism === "garden") return "garden";
  if (natural === "peak" || natural === "volcano" || natural === "wood") {
    return "nature";
  }

  if (amenity === "cafe") return "cafe";
  if (amenity === "restaurant" || amenity === "fast_food") return "restaurant";
  if (amenity === "cinema") return "cinema";
  if (shop === "books") return "bookstore";

  // Explicitly ignore noise POIs
  if (
    amenity === "atm" ||
    amenity === "parking" ||
    amenity === "toilets" ||
    amenity === "vending_machine" ||
    amenity === "bench" ||
    shop === "convenience"
  ) {
    return "other";
  }

  return "other";
}

export function isExploreWorthyCategory(category: PlaceCategory): boolean {
  return category !== "other";
}

export function assertCategory(value: string): PlaceCategory {
  return isPlaceCategory(value) ? value : "other";
}
