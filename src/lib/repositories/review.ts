import { and, eq, sql } from "drizzle-orm";
import { db } from "@/data/db";
import {
  places,
  placeExternalReferences,
  exploreLayers,
  exploreLayerPlaces,
} from "@/data/db/schema";
import { assertCategory } from "@/lib/places/categoryMapping";
import { defaultMinZoomForImportance } from "@/lib/places/importance";
import type { PlaceReviewStatus } from "@/types/place";

export type ReviewSort =
  | "priority"
  | "importance"
  | "name"
  | "region"
  | "source"
  | "recent";

export interface ReviewFilters {
  regionId?: string | null;
  category?: string | null;
  importance?: number | null;
  sourceType?: string | null;
  reviewStatus?: PlaceReviewStatus | "all" | null;
  layerId?: string | null;
  provider?: string | null;
  q?: string | null;
  sort?: ReviewSort;
  limit?: number;
  offset?: number;
}

export interface ReviewPlaceRow {
  id: string;
  name: string;
  nameJa: string | null;
  nameEn: string | null;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  image: string;
  regionId: string | null;
  importance: number;
  minZoom: number;
  sourceType: string;
  reviewStatus: string;
  reviewedAt: string | null;
  reviewSource: string | null;
  possibleDuplicateOf: string | null;
  provider: string | null;
  externalId: string | null;
  rawMetadata: string | null;
  layers: Array<{ id: string; name: string; note: string | null }>;
  warnings: string[];
  priorityScore: number;
}

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function nameSimilar(a: string, b: string) {
  const na = a.replace(/\s+/g, "").toLowerCase();
  const nb = b.replace(/\s+/g, "").toLowerCase();
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function computeWarnings(row: {
  regionId: string | null;
  category: string;
  description: string;
  image: string;
  importance: number;
  sourceType: string;
  possibleDuplicateOf: string | null;
}): string[] {
  const warnings: string[] = [];
  if (!row.regionId) warnings.push("missing_region");
  if (row.category === "other") warnings.push("category_other");
  if (!row.description?.trim()) warnings.push("missing_description");
  if (!row.image?.trim()) warnings.push("missing_image");
  if (row.importance <= 2 && row.sourceType === "imported") {
    warnings.push("high_importance_osm");
  }
  if (row.possibleDuplicateOf) warnings.push("possible_duplicate");
  return warnings;
}

function priorityScore(warnings: string[], importance: number) {
  let score = 0;
  if (warnings.includes("possible_duplicate")) score += 50;
  if (warnings.includes("missing_region")) score += 30;
  if (warnings.includes("category_other")) score += 20;
  if (warnings.includes("high_importance_osm")) score += 15;
  if (warnings.includes("missing_description")) score += 10;
  if (warnings.includes("missing_image")) score += 5;
  score += Math.max(0, 4 - importance) * 3;
  return score;
}

/** Mark soft duplicates within ~100m + similar names (same region). */
export function refreshDuplicateCandidates(scopeRegionPrefix = "ward-13") {
  const rows = db
    .select({
      id: places.id,
      name: places.name,
      latitude: places.latitude,
      longitude: places.longitude,
      regionId: places.regionId,
      reviewStatus: places.reviewStatus,
    })
    .from(places)
    .all()
    .filter(
      (row) =>
        row.reviewStatus !== "rejected" &&
        (!scopeRegionPrefix ||
          row.regionId?.startsWith(scopeRegionPrefix) ||
          row.regionId === "pref-13")
    );

  // Clear previous soft links in scope
  for (const row of rows) {
    if (row.id) {
      db.update(places)
        .set({ possibleDuplicateOf: null })
        .where(eq(places.id, row.id))
        .run();
    }
  }

  let linked = 0;
  for (let i = 0; i < rows.length; i++) {
    const a = rows[i];
    for (let j = i + 1; j < rows.length; j++) {
      const b = rows[j];
      if (a.regionId && b.regionId && a.regionId !== b.regionId) continue;
      if (!nameSimilar(a.name, b.name)) continue;
      const dist = haversineMeters(
        a.latitude,
        a.longitude,
        b.latitude,
        b.longitude
      );
      if (dist > 100) continue;
      db.update(places)
        .set({ possibleDuplicateOf: b.id })
        .where(eq(places.id, a.id))
        .run();
      db.update(places)
        .set({ possibleDuplicateOf: a.id })
        .where(eq(places.id, b.id))
        .run();
      linked += 1;
    }
  }
  return linked;
}

export function listReviewPlaces(filters: ReviewFilters = {}): {
  items: ReviewPlaceRow[];
  total: number;
} {
  const limit = filters.limit ?? 80;
  const offset = filters.offset ?? 0;

  let rows = db.select().from(places).all();

  if (filters.reviewStatus && filters.reviewStatus !== "all") {
    rows = rows.filter((r) => r.reviewStatus === filters.reviewStatus);
  }
  if (filters.regionId) {
    const rid = filters.regionId;
    rows = rows.filter((r) => {
      if (!r.regionId) return rid === "missing";
      if (rid === "pref-13") {
        return r.regionId === "pref-13" || r.regionId.startsWith("ward-13");
      }
      if (rid === "tokyo-core") {
        return [
          "ward-13101",
          "ward-13102",
          "ward-13103",
          "ward-13104",
          "ward-13105",
          "ward-13106",
          "ward-13107",
          "ward-13108",
          "ward-13113",
          "ward-13116",
        ].includes(r.regionId);
      }
      return r.regionId === rid;
    });
  }
  if (filters.category) {
    rows = rows.filter((r) => r.category === filters.category);
  }
  if (filters.importance != null) {
    rows = rows.filter((r) => r.importance === filters.importance);
  }
  if (filters.sourceType) {
    rows = rows.filter((r) => r.sourceType === filters.sourceType);
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.nameJa ?? "").toLowerCase().includes(q) ||
        (r.nameEn ?? "").toLowerCase().includes(q)
    );
  }

  if (filters.layerId) {
    const linked = new Set(
      db
        .select({ placeId: exploreLayerPlaces.placeId })
        .from(exploreLayerPlaces)
        .where(eq(exploreLayerPlaces.layerId, filters.layerId))
        .all()
        .map((r) => r.placeId)
    );
    rows = rows.filter((r) => linked.has(r.id));
  }

  const refs = db.select().from(placeExternalReferences).all();
  const refByPlace = new Map<string, (typeof refs)[0]>();
  for (const ref of refs) {
    if (!refByPlace.has(ref.placeId)) refByPlace.set(ref.placeId, ref);
  }

  if (filters.provider) {
    rows = rows.filter(
      (r) => refByPlace.get(r.id)?.provider === filters.provider
    );
  }

  const allLayers = db.select().from(exploreLayers).all();
  const layerName = new Map(allLayers.map((l) => [l.id, l.name]));
  const links = db.select().from(exploreLayerPlaces).all();
  const layersByPlace = new Map<
    string,
    Array<{ id: string; name: string; note: string | null }>
  >();
  for (const link of links) {
    const list = layersByPlace.get(link.placeId) ?? [];
    list.push({
      id: link.layerId,
      name: layerName.get(link.layerId) ?? link.layerId,
      note: link.note,
    });
    layersByPlace.set(link.placeId, list);
  }

  let items: ReviewPlaceRow[] = rows.map((row) => {
    const ref = refByPlace.get(row.id);
    const warnings = computeWarnings(row);
    return {
      id: row.id,
      name: row.name,
      nameJa: row.nameJa,
      nameEn: row.nameEn,
      description: row.description,
      latitude: row.latitude,
      longitude: row.longitude,
      category: row.category,
      image: row.image,
      regionId: row.regionId,
      importance: row.importance,
      minZoom: row.minZoom,
      sourceType: row.sourceType,
      reviewStatus: row.reviewStatus,
      reviewedAt: row.reviewedAt,
      reviewSource: row.reviewSource,
      possibleDuplicateOf: row.possibleDuplicateOf,
      provider: ref?.provider ?? null,
      externalId: ref?.externalId ?? null,
      rawMetadata: ref?.rawMetadata ?? null,
      layers: layersByPlace.get(row.id) ?? [],
      warnings,
      priorityScore: priorityScore(warnings, row.importance),
    };
  });

  const sort = filters.sort ?? "priority";
  items.sort((a, b) => {
    if (sort === "priority") return b.priorityScore - a.priorityScore;
    if (sort === "importance") return a.importance - b.importance;
    if (sort === "name") return a.name.localeCompare(b.name, "ja");
    if (sort === "region")
      return (a.regionId ?? "").localeCompare(b.regionId ?? "");
    if (sort === "source") return a.sourceType.localeCompare(b.sourceType);
    if (sort === "recent")
      return (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? "");
    return 0;
  });

  const total = items.length;
  items = items.slice(offset, offset + limit);
  return { items, total };
}

export function getReviewStats(scope: "tokyo" | "all" = "tokyo") {
  const rows = db.select().from(places).all();
  const inScope = (regionId: string | null) => {
    if (scope === "all") return true;
    if (!regionId) return false;
    return regionId === "pref-13" || regionId.startsWith("ward-13");
  };
  const scoped = rows.filter((r) => inScope(r.regionId));

  const byStatus = { pending: 0, approved: 0, rejected: 0 };
  const byWard = new Map<string, number>();
  const byCategory = new Map<string, number>();
  const byImportance = { 1: 0, 2: 0, 3: 0 };
  let missingRegion = 0;
  let possibleDuplicate = 0;

  for (const row of scoped) {
    const st = (row.reviewStatus || "pending") as keyof typeof byStatus;
    if (st in byStatus) byStatus[st] += 1;
    if (!row.regionId) missingRegion += 1;
    if (row.possibleDuplicateOf) possibleDuplicate += 1;
    byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + 1);
    const imp = (row.importance ?? 3) as 1 | 2 | 3;
    if (imp in byImportance) byImportance[imp] += 1;
    const ward = row.regionId?.startsWith("ward-")
      ? row.regionId
      : row.regionId ?? "missing";
    byWard.set(ward, (byWard.get(ward) ?? 0) + 1);
  }

  const layerCount = db.select().from(exploreLayers).all().length;

  return {
    total: scoped.length,
    ...byStatus,
    missingRegion,
    possibleDuplicate,
    byWard: Object.fromEntries(byWard),
    byCategory: Object.fromEntries(byCategory),
    byImportance,
    exploreViewCount: layerCount,
  };
}

export function updateReviewPlace(
  placeId: string,
  patch: {
    reviewStatus?: PlaceReviewStatus;
    category?: string;
    importance?: number;
    name?: string;
    description?: string;
    regionId?: string | null;
    nameJa?: string | null;
    nameEn?: string | null;
    reviewSource?: string;
  }
) {
  const existing = db.select().from(places).where(eq(places.id, placeId)).get();
  if (!existing) return null;

  const updates: Record<string, unknown> = {};
  if (patch.reviewStatus) {
    updates.reviewStatus = patch.reviewStatus;
    updates.reviewedAt = new Date().toISOString();
    updates.reviewSource = patch.reviewSource ?? "manual";
  }
  if (patch.category) updates.category = assertCategory(patch.category);
  if (patch.importance != null) {
    updates.importance = patch.importance;
    updates.minZoom = defaultMinZoomForImportance(patch.importance);
  }
  if (patch.name != null) updates.name = patch.name.trim();
  if (patch.description != null) updates.description = patch.description.trim();
  if (patch.regionId !== undefined) updates.regionId = patch.regionId;
  if (patch.nameJa !== undefined) updates.nameJa = patch.nameJa;
  if (patch.nameEn !== undefined) updates.nameEn = patch.nameEn;

  db.update(places).set(updates).where(eq(places.id, placeId)).run();
  return db.select().from(places).where(eq(places.id, placeId)).get();
}

export function batchReviewPlaces(input: {
  placeIds: string[];
  reviewStatus?: PlaceReviewStatus;
  category?: string;
  importance?: number;
  addLayerId?: string;
  removeLayerId?: string;
  layerNote?: string | null;
}) {
  let updated = 0;
  for (const id of input.placeIds) {
    if (
      input.reviewStatus ||
      input.category ||
      input.importance != null
    ) {
      updateReviewPlace(id, {
        reviewStatus: input.reviewStatus,
        category: input.category,
        importance: input.importance,
      });
      updated += 1;
    }
    if (input.addLayerId) {
      const exists = db
        .select()
        .from(exploreLayerPlaces)
        .where(
          and(
            eq(exploreLayerPlaces.layerId, input.addLayerId),
            eq(exploreLayerPlaces.placeId, id)
          )
        )
        .get();
      if (!exists) {
        const order =
          db
            .select({ n: sql<number>`count(*)` })
            .from(exploreLayerPlaces)
            .where(eq(exploreLayerPlaces.layerId, input.addLayerId))
            .get()?.n ?? 0;
        db.insert(exploreLayerPlaces)
          .values({
            layerId: input.addLayerId,
            placeId: id,
            priority: 0,
            order: Number(order),
            note: input.layerNote ?? null,
          })
          .run();
      }
    }
    if (input.removeLayerId) {
      db.delete(exploreLayerPlaces)
        .where(
          and(
            eq(exploreLayerPlaces.layerId, input.removeLayerId),
            eq(exploreLayerPlaces.placeId, id)
          )
        )
        .run();
    }
  }
  return { updated, count: input.placeIds.length };
}

export function setPlaceLayerNote(
  layerId: string,
  placeId: string,
  note: string | null
) {
  const exists = db
    .select()
    .from(exploreLayerPlaces)
    .where(
      and(
        eq(exploreLayerPlaces.layerId, layerId),
        eq(exploreLayerPlaces.placeId, placeId)
      )
    )
    .get();
  if (!exists) return false;
  db.update(exploreLayerPlaces)
    .set({ note })
    .where(
      and(
        eq(exploreLayerPlaces.layerId, layerId),
        eq(exploreLayerPlaces.placeId, placeId)
      )
    )
    .run();
  return true;
}

export function updateExploreView(
  layerId: string,
  patch: {
    name?: string;
    description?: string;
    regionId?: string | null;
    coverImage?: string;
    visibility?: string;
  }
) {
  const existing = db
    .select()
    .from(exploreLayers)
    .where(eq(exploreLayers.id, layerId))
    .get();
  if (!existing) return null;
  db.update(exploreLayers)
    .set({
      name: patch.name ?? existing.name,
      description: patch.description ?? existing.description,
      regionId: patch.regionId === undefined ? existing.regionId : patch.regionId,
      coverImage: patch.coverImage ?? existing.coverImage,
      visibility: patch.visibility ?? existing.visibility,
    })
    .where(eq(exploreLayers.id, layerId))
    .run();
  return db.select().from(exploreLayers).where(eq(exploreLayers.id, layerId)).get();
}

export function suggestViewCandidates(layerId: string, limit = 40) {
  const layer = db
    .select()
    .from(exploreLayers)
    .where(eq(exploreLayers.id, layerId))
    .get();
  if (!layer) return [];

  const linked = new Set(
    db
      .select({ placeId: exploreLayerPlaces.placeId })
      .from(exploreLayerPlaces)
      .where(eq(exploreLayerPlaces.layerId, layerId))
      .all()
      .map((r) => r.placeId)
  );

  const categoryHints: Record<string, string[]> = {
    "museum-tokyo": ["museum", "art_museum"],
    "literary-tokyo": ["bookstore", "memorial", "cafe", "street", "museum"],
    "classic-tokyo": ["landmark", "observation", "shrine", "temple", "park"],
    "gardens-shrines-tokyo": ["garden", "shrine", "temple", "park"],
    "modern-architecture-tokyo": ["landmark", "observation", "museum"],
    "tokyo-skyline": ["observation", "landmark"],
    "rainy-tokyo": ["museum", "art_museum", "bookstore", "cafe"],
    "waterfront-tokyo": ["park", "aquarium", "landmark", "observation"],
    "bookstore-tokyo": ["bookstore", "cafe", "street", "memorial"],
    "showa-tokyo": ["street", "cafe", "memorial", "park", "landmark"],
  };

  const keywordHints: Record<string, string[]> = {
    "literary-tokyo": ["本", "書", "文学", "漱石", "鴎外", "神保", "出版"],
    "museum-tokyo": ["博物", "美術館", "ミュージアム"],
    "gardens-shrines-tokyo": ["神社", "寺", "庭園", "公園"],
    "tokyo-skyline": ["展望", "タワー", "スカイ"],
    "waterfront-tokyo": ["海", "台場", "隅田", "水辺", "水族"],
    "bookstore-tokyo": ["本", "書", "出版", "神保", "書店"],
    "showa-tokyo": ["商店街", "下町", "昭和", "銭湯", "アーケード"],
  };

  const cats = categoryHints[layerId] ?? [];
  const keys = keywordHints[layerId] ?? [];

  return db
    .select()
    .from(places)
    .all()
    .filter((p) => {
      if (linked.has(p.id)) return false;
      if (p.reviewStatus === "rejected") return false;
      const inTokyo =
        p.regionId === "pref-13" || p.regionId?.startsWith("ward-13");
      if (!inTokyo) return false;
      if (cats.length && cats.includes(p.category)) return true;
      if (keys.some((k) => p.name.includes(k) || p.description.includes(k))) {
        return true;
      }
      return false;
    })
    .sort((a, b) => a.importance - b.importance)
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      regionId: p.regionId,
      importance: p.importance,
      reviewStatus: p.reviewStatus,
    }));
}

export function draftViewNote(placeName: string, layerId: string): string {
  const templates: Record<string, string> = {
    "literary-tokyo": `${placeName}——东京文字与出版记忆的一部分。`,
    "museum-tokyo": `${placeName}——东京博物馆路线上的一站。`,
    "classic-tokyo": `${placeName}——理解东京城市骨架的重要节点。`,
    "gardens-shrines-tokyo": `${placeName}——庭园与寺社节奏中的一处停顿。`,
    "tokyo-skyline": `${placeName}——俯瞰东京的视角之一。`,
    "rainy-tokyo": `${placeName}——适合雨天停留的室内探索点。`,
    "waterfront-tokyo": `${placeName}——东京水边风景的一部分。`,
    "modern-architecture-tokyo": `${placeName}——现代东京建筑与空间的样本。`,
  };
  return templates[layerId] ?? `${placeName}——本主题中的探索地点。`;
}
