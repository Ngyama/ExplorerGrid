import { and, eq } from "drizzle-orm";
import { db } from "./index";
import {
  places,
  exploreLayers,
  exploreLayerPlaces,
  userPlaces,
  visits,
  photos,
} from "./schema";
import {
  ALL_PLACES,
  EXPLORE_LAYERS,
  LAYER_PLACE_LINKS,
} from "../seed/tokyo";

function upsertContent() {
  for (const place of ALL_PLACES) {
    const existing = db
      .select()
      .from(places)
      .where(eq(places.id, place.id))
      .get();
    if (!existing) {
      db.insert(places).values(place).run();
    } else {
      db.update(places)
        .set({
          name: place.name,
          description: place.description,
          latitude: place.latitude,
          longitude: place.longitude,
          category: place.category,
          image: place.image,
          regionId: place.regionId,
          importance: place.importance,
          minZoom: place.minZoom,
        })
        .where(eq(places.id, place.id))
        .run();
    }
  }

  for (const layer of EXPLORE_LAYERS) {
    const existing = db
      .select()
      .from(exploreLayers)
      .where(eq(exploreLayers.id, layer.id))
      .get();
    if (!existing) {
      db.insert(exploreLayers).values(layer).run();
    } else {
      db.update(exploreLayers)
        .set({
          name: layer.name,
          description: layer.description,
          coverImage: layer.coverImage,
          regionId: layer.regionId,
        })
        .where(eq(exploreLayers.id, layer.id))
        .run();
    }
  }

  const links = Object.entries(LAYER_PLACE_LINKS).flatMap(
    ([layerId, placeIds]) =>
      placeIds.map((placeId, index) => ({
        layerId,
        placeId,
        priority: placeIds.length - index,
        order: index,
      }))
  );

  for (const link of links) {
    const existing = db
      .select()
      .from(exploreLayerPlaces)
      .where(
        and(
          eq(exploreLayerPlaces.layerId, link.layerId),
          eq(exploreLayerPlaces.placeId, link.placeId)
        )
      )
      .get();
    if (!existing) {
      db.insert(exploreLayerPlaces).values(link).run();
    } else {
      db.update(exploreLayerPlaces)
        .set({ priority: link.priority, order: link.order })
        .where(
          and(
            eq(exploreLayerPlaces.layerId, link.layerId),
            eq(exploreLayerPlaces.placeId, link.placeId)
          )
        )
        .run();
    }
  }
}

export function seedDatabase(options?: { resetUserData?: boolean }) {
  const placeCount = db.select().from(places).all().length;
  upsertContent();

  if (placeCount === 0) {
    console.log(
      `Seeded ${ALL_PLACES.length} places, ${EXPLORE_LAYERS.length} layers.`
    );
  } else {
    console.log(
      `Synced places/layers (${ALL_PLACES.length} places, ${EXPLORE_LAYERS.length} layers).`
    );
  }

  if (options?.resetUserData) {
    db.delete(photos).run();
    db.delete(visits).run();
    db.delete(userPlaces).run();
    console.log("Reset user places, visits, and photos.");
  }
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("data/db/seed.ts");

if (isMain) {
  const reset = process.argv.includes("--reset");
  seedDatabase({ resetUserData: reset });
}
