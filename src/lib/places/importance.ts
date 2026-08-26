import type { PlaceCategory } from "@/types/place";

/** importance: 1 = national, 2 = regional, 3 = local */
export function defaultMinZoomForImportance(importance: number): number {
  if (importance <= 1) return 5;
  if (importance <= 2) return 8;
  return 11;
}

export function inferImportanceFromOsm(tags: Record<string, string | undefined>): number {
  const wikidata = tags.wikidata;
  const wikipedia = tags.wikipedia;
  const tourism = tags.tourism;
  const historic = tags.historic;

  if (
    historic === "castle" ||
    tourism === "theme_park" ||
    tags.name === "富士山" ||
    tags["name:en"] === "Mount Fuji"
  ) {
    return 1;
  }

  if (wikidata && wikipedia) return 2;
  if (wikidata || wikipedia) return 2;
  if (tourism === "museum" || tourism === "aquarium" || tourism === "zoo") {
    return 2;
  }
  return 3;
}

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
  return (
    map[category] ??
    "https://images.unsplash.com/photo-1528164344705-47542687000d?w=800&q=80"
  );
}
