/**
 * Import curated catalog (+ optional live OSM bboxes) into SQLite.
 *
 * Usage:
 *   npm run places:import
 *   npm run places:import -- --live --region tokyo
 *
 * Live OSM imports enter reviewStatus=pending and do NOT auto-join Explore Views.
 */
import fs from "fs";
import path from "path";
import { db } from "@/data/db";
import { places } from "@/data/db/schema";
import { seedDatabase } from "@/data/db/seed";
import { osmProvider } from "@/lib/providers/places/osm";
import { scoreImportanceFromOsm } from "@/lib/places/importance";
import { assertCategory } from "@/lib/places/categoryMapping";
import {
  ensureExploreLayer,
  findPlaceIdByExternal,
  upsertFromExternalCandidate,
  upsertPlaceFromCatalog,
  type CatalogPlace,
  type UpsertStats,
} from "@/lib/repositories/placeUpsert";
import { refreshDuplicateCandidates } from "@/lib/repositories/review";
import { eq } from "drizzle-orm";

const CATALOG_PATH = path.join(
  process.cwd(),
  "data/imports/curated-catalog.json"
);

const TOKYO_VIEWS = [
  {
    id: "classic-tokyo",
    name: "经典东京",
    description: "第一次来东京必访的地标与名所，点亮城市的骨架。",
    coverImage:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "museum-tokyo",
    name: "博物馆东京",
    description: "从国立博物馆到设计与科技展馆，雨天也能探索的文化地图。",
    coverImage:
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "literary-tokyo",
    name: "文学东京",
    description: "夏目漱石、森鸥外与神保町——文字留下的城市足迹。",
    coverImage:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "gardens-shrines-tokyo",
    name: "庭园与寺社",
    description: "神社、寺院与庭园——东京节奏里的静谧一侧。",
    coverImage:
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "modern-architecture-tokyo",
    name: "现代建筑东京",
    description: "塔、广场与城市综合体——战后东京的空间实验。",
    coverImage:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "tokyo-skyline",
    name: "东京城市展望",
    description: "从塔顶与高层俯瞰东京盆地的不同高度。",
    coverImage:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "rainy-tokyo",
    name: "雨天东京",
    description: "博物馆、书店与咖啡馆——适合雨天的室内探索。",
    coverImage:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "waterfront-tokyo",
    name: "水边东京",
    description: "隅田川、台场与港口——东京面向水的一面。",
    coverImage:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "bookstore-tokyo",
    name: "书店与出版文化",
    description: "神保町到早稻田——旧书、独立书店与出版街的东京。",
    coverImage:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "showa-tokyo",
    name: "昭和东京",
    description: "下町、商店街与战后日常景观——仍留在街角的昭和气味。",
    coverImage:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    regionId: "pref-13",
  },
];

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

/** Tokyo 23-wards-ish bbox; higher limit for review pool. */
const LIVE_REGIONS: Record<
  string,
  { bbox: [number, number, number, number]; limit: number }
> = {
  tokyo: { bbox: [35.58, 139.60, 35.78, 139.92], limit: 350 },
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

  for (const layer of [...TOKYO_VIEWS, ...EXTRA_LAYERS]) {
    ensureExploreLayer(layer);
  }

  for (const item of raw.places) {
    const layerNotes = { ...(item.layerNotes ?? {}) };
    for (const layerId of item.layers ?? []) {
      const note = LAYER_NOTES[layerId]?.[item.id];
      if (note) layerNotes[layerId] = note;
    }
    upsertPlaceFromCatalog(
      { ...item, sourceType: item.sourceType ?? "curated", layerNotes },
      stats
    );
  }
}

async function importSnapshot(filePath: string, stats: UpsertStats) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing snapshot: ${filePath}`);
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    places: Array<{
      provider: string;
      externalId: string;
      name: string;
      nameJa?: string;
      nameEn?: string;
      latitude: number;
      longitude: number;
      category: string;
      description?: string;
      regionId?: string;
      importance?: number;
      rawMetadata?: Record<string, unknown>;
    }>;
  };
  console.log(`Importing snapshot pending pool (${raw.places.length})…`);
  for (const item of raw.places) {
    const tags =
      item.rawMetadata && "tags" in item.rawMetadata
        ? (item.rawMetadata.tags as Record<string, string | undefined>)
        : {};
    const category = assertCategory(item.category);
    const importance =
      item.importance ?? scoreImportanceFromOsm(tags, category);
    const { created } = upsertFromExternalCandidate(
      {
        provider: item.provider,
        externalId: item.externalId,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        category,
        description: item.description,
        rawMetadata: item.rawMetadata,
        sourceUpdatedAt: new Date().toISOString(),
      },
      {
        sourceType: "imported",
        importance,
        layerIds: [],
        tags,
      }
    );
    // Ensure names / region from snapshot
    const placeId = findPlaceIdByExternal(item.provider, item.externalId);
    if (placeId) {
      db.update(places)
        .set({
          regionId: item.regionId ?? undefined,
          nameJa: item.nameJa ?? null,
          nameEn: item.nameEn ?? null,
          reviewStatus: "pending",
          reviewSource: "import",
        })
        .where(eq(places.id, placeId))
        .run();
    }
    if (created) stats.inserted += 1;
    else stats.updated += 1;
    stats.linked += 1;
  }
}

async function importLive(regionKey: string, stats: UpsertStats) {
  const region = LIVE_REGIONS[regionKey];
  if (!region) {
    console.warn(`Unknown --region ${regionKey}, skip live fetch`);
    return;
  }
  console.log(`Fetching OSM tourism POIs for ${regionKey} (pending pool)…`);
  const candidates = await osmProvider.fetchTourismInBbox(
    region.bbox,
    region.limit
  );
  console.log(`OSM returned ${candidates.length} candidates`);
  for (const candidate of candidates) {
    const tags =
      candidate.rawMetadata &&
      typeof candidate.rawMetadata === "object" &&
      "tags" in candidate.rawMetadata
        ? (candidate.rawMetadata.tags as Record<string, string | undefined>)
        : {};
    const category = assertCategory(candidate.category);
    const importance = scoreImportanceFromOsm(tags, category);
    const { created } = upsertFromExternalCandidate(candidate, {
      sourceType: "imported",
      importance,
      // Do NOT auto-join Explore Views — Review decides.
      layerIds: [],
      tags,
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
  const snapshotIdx = args.indexOf("--snapshot");
  const snapshotPath =
    snapshotIdx >= 0
      ? args[snapshotIdx + 1]
      : args.includes("--tokyo-pending")
        ? path.join(process.cwd(), "data/imports/tokyo-pending-snapshot.json")
        : null;

  seedDatabase();

  const stats: UpsertStats = {
    inserted: 0,
    updated: 0,
    linked: 0,
    skipped: 0,
  };

  console.log("Importing curated catalog (approved)…");
  await importCatalog(stats);

  if (snapshotPath) {
    try {
      await importSnapshot(snapshotPath, stats);
    } catch (err) {
      console.warn("Snapshot import failed:", err);
    }
  }

  if (live || regionArg) {
    const keys = regionArg === "all" ? Object.keys(LIVE_REGIONS) : [regionArg!];
    for (const key of keys) {
      try {
        await importLive(key, stats);
      } catch (err) {
        console.warn(`Live import failed for ${key}:`, err);
        if (key === "tokyo" && !snapshotPath) {
          const fallback = path.join(
            process.cwd(),
            "data/imports/tokyo-pending-snapshot.json"
          );
          console.warn(`Falling back to snapshot ${fallback}`);
          try {
            await importSnapshot(fallback, stats);
          } catch (err2) {
            console.warn("Snapshot fallback failed:", err2);
          }
        }
      }
    }
  }

  const dupes = refreshDuplicateCandidates("ward-13");
  const all = db.select().from(places).all();
  const total = all.length;
  const pending = all.filter((p) => p.reviewStatus === "pending").length;
  const approved = all.filter((p) => p.reviewStatus === "approved").length;

  console.log("Import complete:", stats);
  console.log(`Total places: ${total} · approved ${approved} · pending ${pending}`);
  console.log(`Soft duplicate pairs marked: ${dupes}`);
  console.log("Open /admin/review to triage pending Tokyo places.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
