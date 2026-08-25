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
  TOKYO_LAYERS,
  TOKYO_PLACES,
  LAYER_PLACE_LINKS,
} from "../seed/tokyo";

export function seedDatabase(options?: { resetUserData?: boolean }) {
  const placeCount = db.select().from(places).all().length;

  if (placeCount === 0) {
    db.insert(places).values(TOKYO_PLACES).run();
    db.insert(exploreLayers).values([...TOKYO_LAYERS]).run();

    const links = Object.entries(LAYER_PLACE_LINKS).flatMap(
      ([layerId, placeIds]) =>
        placeIds.map((placeId, index) => ({
          layerId,
          placeId,
          priority: placeIds.length - index,
          order: index,
        }))
    );

    db.insert(exploreLayerPlaces).values(links).run();
    console.log(
      `Seeded ${TOKYO_PLACES.length} places, ${TOKYO_LAYERS.length} layers.`
    );
  } else {
    console.log(`Places already seeded (${placeCount}). Skipping content seed.`);
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
