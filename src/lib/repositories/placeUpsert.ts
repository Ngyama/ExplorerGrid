import { and, eq, like, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/data/db";
import {
  places,
  placeExternalReferences,
  exploreLayers,
  exploreLayerPlaces,
} from "@/data/db/schema";
import { assignRegionId } from "@/lib/places/assignRegion";
import {
  buildNeutralDescription,
  defaultMinZoomForImportance,
  placeholderImageForCategory,
  scoreImportanceFromOsm,
} from "@/lib/places/importance";
import { assertCategory } from "@/lib/places/categoryMapping";
import type { ExternalPlaceCandidate } from "@/lib/providers/places/types";
import type {
  PlaceCategory,
  PlaceReviewStatus,
  PlaceSourceType,
} from "@/types/place";

export type CatalogPlace = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  image?: string;
  regionId?: string | null;
  importance: number;
  minZoom?: number;
  sourceType?: PlaceSourceType;
  osm?: string | null;
  layers?: string[];
  layerNotes?: Record<string, string>;
  nameJa?: string | null;
  nameEn?: string | null;
};

export type UpsertStats = {
  inserted: number;
  updated: number;
  linked: number;
  skipped: number;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function reviewDefaultsForSource(sourceType: PlaceSourceType): {
  reviewStatus: PlaceReviewStatus;
  reviewSource: string;
  reviewedAt: string | null;
} {
  if (sourceType === "imported") {
    return {
      reviewStatus: "pending",
      reviewSource: "import",
      reviewedAt: null,
    };
  }
  return {
    reviewStatus: "approved",
    reviewSource: sourceType === "custom" ? "manual" : "curated",
    reviewedAt: new Date().toISOString(),
  };
}

export function findPlaceIdByExternal(
  provider: string,
  externalId: string
): string | null {
  const row = db
    .select()
    .from(placeExternalReferences)
    .where(
      and(
        eq(placeExternalReferences.provider, provider),
        eq(placeExternalReferences.externalId, externalId)
      )
    )
    .get();
  return row?.placeId ?? null;
}

export function upsertExternalReference(input: {
  placeId: string;
  provider: string;
  externalId: string;
  rawMetadata?: unknown;
  sourceUpdatedAt?: string;
}) {
  const existing = db
    .select()
    .from(placeExternalReferences)
    .where(
      and(
        eq(placeExternalReferences.provider, input.provider),
        eq(placeExternalReferences.externalId, input.externalId)
      )
    )
    .get();

  const raw =
    input.rawMetadata === undefined
      ? null
      : JSON.stringify(input.rawMetadata);

  if (existing) {
    db.update(placeExternalReferences)
      .set({
        placeId: input.placeId,
        rawMetadata: raw,
        sourceUpdatedAt: input.sourceUpdatedAt ?? existing.sourceUpdatedAt,
      })
      .where(eq(placeExternalReferences.id, existing.id))
      .run();
    return existing.id;
  }

  const id = randomUUID();
  db.insert(placeExternalReferences)
    .values({
      id,
      placeId: input.placeId,
      provider: input.provider,
      externalId: input.externalId,
      rawMetadata: raw,
      sourceUpdatedAt: input.sourceUpdatedAt ?? new Date().toISOString(),
    })
    .run();
  return id;
}

export function upsertPlaceFromCatalog(
  item: CatalogPlace,
  stats: UpsertStats
): string {
  const category = assertCategory(item.category);
  const regionId =
    item.regionId ?? assignRegionId(item.longitude, item.latitude);
  const importance = item.importance ?? 3;
  const minZoom =
    item.minZoom ?? defaultMinZoomForImportance(importance);
  const image = item.image ?? placeholderImageForCategory(category);
  const sourceType = item.sourceType ?? "curated";
  const review = reviewDefaultsForSource(sourceType);

  let placeId = item.id;
  if (item.osm) {
    const linked = findPlaceIdByExternal("osm", item.osm);
    if (linked) placeId = linked;
  }

  const existing = db
    .select()
    .from(places)
    .where(eq(places.id, placeId))
    .get();

  if (!existing) {
    db.insert(places)
      .values({
        id: placeId,
        name: item.name,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        category,
        image,
        regionId,
        importance,
        minZoom,
        sourceType,
        reviewStatus: review.reviewStatus,
        reviewSource: review.reviewSource,
        reviewedAt: review.reviewedAt,
        nameJa: item.nameJa ?? null,
        nameEn: item.nameEn ?? null,
      })
      .run();
    stats.inserted += 1;
  } else {
    // Do not downgrade human-approved places when re-importing curated.
    const keepReview =
      existing.reviewStatus === "approved" ||
      existing.reviewStatus === "rejected";
    db.update(places)
      .set({
        name: item.name,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        category,
        image: image || existing.image,
        regionId,
        importance,
        minZoom,
        sourceType:
          existing.sourceType === "custom" ? "custom" : sourceType,
        nameJa: item.nameJa ?? existing.nameJa,
        nameEn: item.nameEn ?? existing.nameEn,
        ...(keepReview
          ? {}
          : {
              reviewStatus: review.reviewStatus,
              reviewSource: review.reviewSource,
              reviewedAt: review.reviewedAt,
            }),
      })
      .where(eq(places.id, placeId))
      .run();
    stats.updated += 1;
  }

  if (item.osm) {
    upsertExternalReference({
      placeId,
      provider: "osm",
      externalId: item.osm,
      sourceUpdatedAt: new Date().toISOString(),
    });
    stats.linked += 1;
  }

  for (const layerId of item.layers ?? []) {
    const note = item.layerNotes?.[layerId] ?? null;
    const link = db
      .select()
      .from(exploreLayerPlaces)
      .where(
        and(
          eq(exploreLayerPlaces.layerId, layerId),
          eq(exploreLayerPlaces.placeId, placeId)
        )
      )
      .get();
    if (!link) {
      const order =
        db
          .select({ n: sql<number>`count(*)` })
          .from(exploreLayerPlaces)
          .where(eq(exploreLayerPlaces.layerId, layerId))
          .get()?.n ?? 0;
      db.insert(exploreLayerPlaces)
        .values({
          layerId,
          placeId,
          priority: 0,
          order: Number(order),
          note,
        })
        .run();
    } else if (note) {
      db.update(exploreLayerPlaces)
        .set({ note })
        .where(
          and(
            eq(exploreLayerPlaces.layerId, layerId),
            eq(exploreLayerPlaces.placeId, placeId)
          )
        )
        .run();
    }
  }

  return placeId;
}

export function upsertFromExternalCandidate(
  candidate: ExternalPlaceCandidate,
  options?: {
    sourceType?: PlaceSourceType;
    importance?: number;
    /** Live imports should NOT auto-join formal Explore Views. */
    layerIds?: string[];
    tags?: Record<string, string | undefined>;
  }
): { placeId: string; created: boolean } {
  const existingId = findPlaceIdByExternal(
    candidate.provider,
    candidate.externalId
  );
  const category = assertCategory(candidate.category);
  const tags = options?.tags ??
    (candidate.rawMetadata &&
    typeof candidate.rawMetadata === "object" &&
    "tags" in candidate.rawMetadata
      ? (candidate.rawMetadata.tags as Record<string, string | undefined>)
      : {});
  const importance =
    options?.importance ?? scoreImportanceFromOsm(tags, category);
  const minZoom = defaultMinZoomForImportance(importance);
  const regionId = assignRegionId(candidate.longitude, candidate.latitude);
  const image = placeholderImageForCategory(category);
  const sourceType = options?.sourceType ?? "imported";
  const review = reviewDefaultsForSource(sourceType);
  const nameJa = tags.name ?? tags["name:ja"] ?? null;
  const nameEn = tags["name:en"] ?? null;
  const description =
    candidate.description?.trim() ||
    buildNeutralDescription({ name: candidate.name, category });

  if (existingId) {
    const existing = db
      .select()
      .from(places)
      .where(eq(places.id, existingId))
      .get();
    // Refresh geo/meta but preserve human review decisions.
    db.update(places)
      .set({
        name: candidate.name,
        description:
          existing?.reviewStatus === "approved"
            ? existing.description
            : description,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        category:
          existing?.reviewStatus === "approved"
            ? existing.category
            : category,
        regionId,
        importance:
          existing?.reviewStatus === "approved"
            ? existing.importance
            : importance,
        minZoom,
        nameJa,
        nameEn,
      })
      .where(eq(places.id, existingId))
      .run();
    upsertExternalReference({
      placeId: existingId,
      provider: candidate.provider,
      externalId: candidate.externalId,
      rawMetadata: candidate.rawMetadata,
      sourceUpdatedAt: candidate.sourceUpdatedAt,
    });
    return { placeId: existingId, created: false };
  }

  const placeId = `${candidate.provider}-${slugify(candidate.externalId)}-${randomUUID().slice(0, 8)}`;
  db.insert(places)
    .values({
      id: placeId,
      name: candidate.name,
      description,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      category,
      image,
      regionId,
      importance,
      minZoom,
      sourceType,
      reviewStatus: review.reviewStatus,
      reviewSource: review.reviewSource,
      reviewedAt: review.reviewedAt,
      nameJa,
      nameEn,
    })
    .run();

  upsertExternalReference({
    placeId,
    provider: candidate.provider,
    externalId: candidate.externalId,
    rawMetadata: candidate.rawMetadata,
    sourceUpdatedAt: candidate.sourceUpdatedAt,
  });

  // Only link layers when explicitly requested (curated path).
  for (const layerId of options?.layerIds ?? []) {
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
    if (!exists) {
      db.insert(exploreLayerPlaces)
        .values({
          layerId,
          placeId,
          priority: 0,
          order: 999,
          note: null,
        })
        .run();
    }
  }

  return { placeId, created: true };
}

export function createCustomPlace(input: {
  name: string;
  category: PlaceCategory;
  description?: string;
  latitude: number;
  longitude: number;
}): string {
  const id = `custom-${randomUUID()}`;
  const category = assertCategory(input.category);
  const review = reviewDefaultsForSource("custom");
  db.insert(places)
    .values({
      id,
      name: input.name.trim(),
      description: input.description?.trim() || "用户自定义地点",
      latitude: input.latitude,
      longitude: input.longitude,
      category,
      image: placeholderImageForCategory(category),
      regionId: assignRegionId(input.longitude, input.latitude),
      importance: 3,
      minZoom: 12,
      sourceType: "custom",
      reviewStatus: review.reviewStatus,
      reviewSource: review.reviewSource,
      reviewedAt: review.reviewedAt,
    })
    .run();
  return id;
}

export function searchLocalPlaces(query: string, limit = 12) {
  const q = `%${query.trim()}%`;
  return db
    .select({
      id: places.id,
      name: places.name,
      latitude: places.latitude,
      longitude: places.longitude,
      category: places.category,
      regionId: places.regionId,
    })
    .from(places)
    .where(
      and(
        or(like(places.name, q), like(places.description, q)),
        or(
          eq(places.reviewStatus, "approved"),
          eq(places.sourceType, "custom")
        )
      )
    )
    .limit(limit)
    .all();
}

export function ensureExploreLayer(layer: {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  regionId: string | null;
  type?: string;
  visibility?: string;
}) {
  const existing = db
    .select()
    .from(exploreLayers)
    .where(eq(exploreLayers.id, layer.id))
    .get();
  if (!existing) {
    db.insert(exploreLayers)
      .values({
        id: layer.id,
        name: layer.name,
        description: layer.description,
        coverImage: layer.coverImage,
        regionId: layer.regionId,
        type: layer.type ?? "curated",
        visibility: layer.visibility ?? "public",
      })
      .run();
  } else {
    db.update(exploreLayers)
      .set({
        name: layer.name,
        description: layer.description,
        coverImage: layer.coverImage,
        regionId: layer.regionId,
        type: layer.type ?? existing.type,
        visibility: layer.visibility ?? existing.visibility,
      })
      .where(eq(exploreLayers.id, layer.id))
      .run();
  }
}
