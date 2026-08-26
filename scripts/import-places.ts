/**
 * Import curated catalog (+ optional live OSM bboxes) into SQLite.
 *
 * Usage:
 *   npm run places:import
 *   npm run places:import -- --live
 *   npm run places:import -- --region tokyo
 */
import fs from "fs";
import path from "path";
import { db } from "@/data/db";
import { places } from "@/data/db/schema";
import { seedDatabase } from "@/data/db/seed";
import { osmProvider } from "@/lib/providers/places/osm";
import {
  ensureExploreLayer,
  upsertFromExternalCandidate,
  upsertPlaceFromCatalog,
  type CatalogPlace,
  type UpsertStats,
} from "@/lib/repositories/placeUpsert";

const CATALOG_PATH = path.join(
  process.cwd(),
  "data/imports/curated-catalog.json"
);

const EXTRA_LAYERS = [
  {
    id: "kyoto-temples",
    name: "京都寺社",
    description: "金阁、清水、伏见稻荷——京都的寺社巡礼骨架。",
    coverImage:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    regionId: "pref-26",
  },
  {
    id: "osaka-classics",
    name: "大阪经典",
    description: "城、街、水族馆与主题乐园——大阪的高密度名所。",
    coverImage:
      "https://images.unsplash.com/photo-1590559899731-a3826e4dbd4b?w=800&q=80",
    regionId: "pref-27",
  },
];

const LAYER_NOTES: Record<string, Record<string, string>> = {
  "literary-tokyo": {
    jimbocho:
      "东京最具代表性的旧书街，也是近代文学出版文化的重要节点。",
    "soseki-museum": "夏目漱石在早稻田的创作据点，文学东京的核心纪念地。",
    "book-and-cafe": "神保町书香咖啡馆——旧书与咖啡并存的阅读空间。",
  },
  "museum-tokyo": {
    "tokyo-national-museum": "日本最大的综合博物馆，上野公园文化轴的起点。",
    "mori-art": "六本木高空美术馆，当代艺术与城市展望并置。",
  },
};

const LIVE_REGIONS: Record<
  string,
  { bbox: [number, number, number, number]; limit: number }
> = {
  tokyo: { bbox: [35.55, 139.55, 35.78, 139.92], limit: 120 },
  kyoto: { bbox: [34.92, 135.68, 35.08, 135.84], limit: 80 },
  osaka: { bbox: [34.58, 135.38, 34.76, 135.58], limit: 80 },
};

async function importCatalog(stats: UpsertStats) {
  if (!fs.existsSync(CATALOG_PATH)) {
    throw new Error(`Missing catalog: ${CATALOG_PATH}`);
  }
  const raw = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8")) as {
    places: CatalogPlace[];
  };

  for (const layer of EXTRA_LAYERS) {
    ensureExploreLayer(layer);
  }

  for (const item of raw.places) {
    const layerNotes = { ...(item.layerNotes ?? {}) };
    for (const layerId of item.layers ?? []) {
      const note = LAYER_NOTES[layerId]?.[item.id];
      if (note) layerNotes[layerId] = note;
    }
    upsertPlaceFromCatalog({ ...item, layerNotes }, stats);
  }
}

async function importLive(regionKey: string, stats: UpsertStats) {
  const region = LIVE_REGIONS[regionKey];
  if (!region) {
    console.warn(`Unknown --region ${regionKey}, skip live fetch`);
    return;
  }
  console.log(`Fetching OSM tourism POIs for ${regionKey}…`);
  const candidates = await osmProvider.fetchTourismInBbox(
    region.bbox,
    region.limit
  );
  console.log(`OSM returned ${candidates.length} candidates`);
  for (const candidate of candidates) {
    const { created } = upsertFromExternalCandidate(candidate, {
      sourceType: "imported",
      importance: 3,
      layerIds:
        regionKey === "tokyo"
          ? ["classic-tokyo"]
          : regionKey === "kyoto"
            ? ["kyoto-temples"]
            : ["osaka-classics"],
    });
    if (created) stats.inserted += 1;
    else stats.updated += 1;
    stats.linked += 1;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes("--live");
  const regionIdx = args.indexOf("--region");
  const regionArg =
    regionIdx >= 0 ? args[regionIdx + 1] : live ? "tokyo" : null;

  // Ensure base curated seed layers exist first.
  seedDatabase();

  const stats: UpsertStats = {
    inserted: 0,
    updated: 0,
    linked: 0,
    skipped: 0,
  };

  console.log("Importing curated catalog…");
  await importCatalog(stats);

  if (live || regionArg) {
    const keys = regionArg === "all" ? Object.keys(LIVE_REGIONS) : [regionArg!];
    for (const key of keys) {
      try {
        await importLive(key, stats);
      } catch (err) {
        console.warn(`Live import failed for ${key}:`, err);
      }
    }
  }

  const total = db.select().from(places).all().length;
  console.log("Import complete:", stats);
  console.log(`Total places in DB: ${total}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
