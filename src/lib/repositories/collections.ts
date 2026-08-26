import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/data/db";
import {
  collections,
  collectionPlaces,
  places,
  userPlaces,
} from "@/data/db/schema";
import { assertCategory } from "@/lib/places/osmCategoryMap";
import { regionMatchesPlace } from "@/lib/geo/regions";
import type { MapPlaceMarker } from "@/types/explore";
import type { CollectionSummary } from "@/types/explore";
import type { Region } from "@/types/region";
import { LOCAL_USER_ID, type UserPlaceStatus } from "@/types/user";

export function listCollections(
  userId: string = LOCAL_USER_ID
): CollectionSummary[] {
  const rows = db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      createdAt: collections.createdAt,
      placeCount: sql<number>`count(${collectionPlaces.placeId})`,
    })
    .from(collections)
    .leftJoin(
      collectionPlaces,
      eq(collectionPlaces.collectionId, collections.id)
    )
    .where(eq(collections.userId, userId))
    .groupBy(collections.id)
    .orderBy(asc(collections.createdAt))
    .all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    placeCount: Number(row.placeCount ?? 0),
  }));
}

export function createCollection(input: {
  name: string;
  description?: string;
  userId?: string;
}): CollectionSummary {
  const id = `col-${randomUUID()}`;
  const createdAt = new Date().toISOString();
  const userId = input.userId ?? LOCAL_USER_ID;
  db.insert(collections)
    .values({
      id,
      userId,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      createdAt,
    })
    .run();
  return {
    id,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    createdAt,
    placeCount: 0,
  };
}

export function addPlaceToCollection(
  collectionId: string,
  placeId: string,
  note?: string
) {
  const existing = db
    .select()
    .from(collectionPlaces)
    .where(
      and(
        eq(collectionPlaces.collectionId, collectionId),
        eq(collectionPlaces.placeId, placeId)
      )
    )
    .get();
  if (existing) {
    if (note !== undefined) {
      db.update(collectionPlaces)
        .set({ note })
        .where(
          and(
            eq(collectionPlaces.collectionId, collectionId),
            eq(collectionPlaces.placeId, placeId)
          )
        )
        .run();
    }
    return;
  }
  const order =
    db
      .select({ n: sql<number>`count(*)` })
      .from(collectionPlaces)
      .where(eq(collectionPlaces.collectionId, collectionId))
      .get()?.n ?? 0;
  db.insert(collectionPlaces)
    .values({
      collectionId,
      placeId,
      note: note ?? null,
      order: Number(order),
    })
    .run();
}

export function removePlaceFromCollection(
  collectionId: string,
  placeId: string
) {
  db.delete(collectionPlaces)
    .where(
      and(
        eq(collectionPlaces.collectionId, collectionId),
        eq(collectionPlaces.placeId, placeId)
      )
    )
    .run();
}

export function listPlaceCollectionIds(
  placeId: string,
  userId: string = LOCAL_USER_ID
): string[] {
  return db
    .select({ id: collections.id })
    .from(collectionPlaces)
    .innerJoin(
      collections,
      eq(collections.id, collectionPlaces.collectionId)
    )
    .where(
      and(
        eq(collectionPlaces.placeId, placeId),
        eq(collections.userId, userId)
      )
    )
    .all()
    .map((row) => row.id);
}

export function getCollectionPlaces(
  collectionId: string,
  userId: string = LOCAL_USER_ID,
  options?: { region?: Region | null; zoom?: number; categories?: string[] }
): MapPlaceMarker[] {
  const collection = db
    .select()
    .from(collections)
    .where(
      and(eq(collections.id, collectionId), eq(collections.userId, userId))
    )
    .get();
  if (!collection) return [];

  const rows = db
    .select({
      id: places.id,
      name: places.name,
      latitude: places.latitude,
      longitude: places.longitude,
      category: places.category,
      status: userPlaces.status,
      regionId: places.regionId,
      importance: places.importance,
      minZoom: places.minZoom,
      order: collectionPlaces.order,
    })
    .from(collectionPlaces)
    .innerJoin(places, eq(collectionPlaces.placeId, places.id))
    .leftJoin(
      userPlaces,
      and(eq(userPlaces.placeId, places.id), eq(userPlaces.userId, userId))
    )
    .where(eq(collectionPlaces.collectionId, collectionId))
    .orderBy(asc(collectionPlaces.order))
    .all();

  const zoom = options?.zoom ?? 20;
  const region = options?.region ?? null;
  const categories = options?.categories;

  return rows
    .filter((row) => {
      if (categories && categories.length > 0 && !categories.includes(row.category)) {
        return false;
      }
      if (zoom + 0.01 < (row.minZoom ?? 10)) return false;
      if (zoom < 7 && (row.importance ?? 3) > 1) return false;
      if (zoom < 9 && (row.importance ?? 3) > 2) return false;
      if (
        region &&
        region.type !== "country" &&
        !regionMatchesPlace(row.regionId, region)
      ) {
        return false;
      }
      return true;
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      category: assertCategory(row.category),
      status: (row.status as UserPlaceStatus | null) ?? null,
      regionId: row.regionId,
      importance: row.importance ?? 3,
      minZoom: row.minZoom ?? 10,
    }));
}

export function getCollectionsContaining(placeIds: string[]) {
  if (placeIds.length === 0) return [];
  return db
    .select({
      collectionId: collectionPlaces.collectionId,
      placeId: collectionPlaces.placeId,
    })
    .from(collectionPlaces)
    .where(inArray(collectionPlaces.placeId, placeIds))
    .all();
}
