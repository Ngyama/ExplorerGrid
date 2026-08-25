import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/data/db";
import { photos, userPlaces, visits } from "@/data/db/schema";
import {
  LOCAL_USER_ID,
  type Photo,
  type PlaceRecord,
  type UserPlace,
  type UserPlaceStatus,
  type Visit,
} from "@/types/user";

function mapUserPlace(row: {
  userId: string;
  placeId: string;
  status: string;
  rating: number | null;
  note: string | null;
}): UserPlace {
  return {
    userId: row.userId,
    placeId: row.placeId,
    status: row.status as UserPlaceStatus,
    rating: row.rating,
    note: row.note,
  };
}

function mapVisit(row: {
  id: string;
  userId: string;
  placeId: string;
  visitedAt: string;
  note: string | null;
}): Visit {
  return {
    id: row.id,
    userId: row.userId,
    placeId: row.placeId,
    visitedAt: row.visitedAt,
    note: row.note,
  };
}

function mapPhoto(row: {
  id: string;
  userId: string;
  placeId: string;
  visitId: string | null;
  url: string;
  createdAt: string;
}): Photo {
  return {
    id: row.id,
    userId: row.userId,
    placeId: row.placeId,
    visitId: row.visitId,
    url: row.url,
    createdAt: row.createdAt,
  };
}

export function getUserPlace(
  placeId: string,
  userId: string = LOCAL_USER_ID
): UserPlace | null {
  const row = db
    .select()
    .from(userPlaces)
    .where(and(eq(userPlaces.userId, userId), eq(userPlaces.placeId, placeId)))
    .get();

  return row ? mapUserPlace(row) : null;
}

export function getPlaceVisits(
  placeId: string,
  userId: string = LOCAL_USER_ID
): Visit[] {
  return db
    .select()
    .from(visits)
    .where(and(eq(visits.userId, userId), eq(visits.placeId, placeId)))
    .orderBy(desc(visits.visitedAt))
    .all()
    .map(mapVisit);
}

export function getPlacePhotos(
  placeId: string,
  userId: string = LOCAL_USER_ID
): Photo[] {
  return db
    .select()
    .from(photos)
    .where(and(eq(photos.userId, userId), eq(photos.placeId, placeId)))
    .orderBy(desc(photos.createdAt))
    .all()
    .map(mapPhoto);
}

export function getPlaceRecord(
  placeId: string,
  userId: string = LOCAL_USER_ID
): PlaceRecord {
  const row = getUserPlace(placeId, userId);
  return {
    status: row?.status ?? null,
    rating: row?.rating ?? null,
    note: row?.note ?? null,
    visits: getPlaceVisits(placeId, userId),
    photos: getPlacePhotos(placeId, userId),
  };
}

function ensureUserPlace(
  placeId: string,
  userId: string,
  fallbackStatus: UserPlaceStatus
): UserPlace {
  const existing = getUserPlace(placeId, userId);
  if (existing) return existing;

  db.insert(userPlaces)
    .values({
      userId,
      placeId,
      status: fallbackStatus,
      rating: null,
      note: null,
    })
    .run();

  return getUserPlace(placeId, userId)!;
}

function insertVisit(params: {
  userId: string;
  placeId: string;
  note?: string | null;
}) {
  db.insert(visits)
    .values({
      id: randomUUID(),
      userId: params.userId,
      placeId: params.placeId,
      visitedAt: new Date().toISOString(),
      note: params.note ?? null,
    })
    .run();
}

export function upsertUserPlaceStatus(params: {
  placeId: string;
  status: UserPlaceStatus;
  userId?: string;
}): PlaceRecord {
  const userId = params.userId ?? LOCAL_USER_ID;
  const existing = getUserPlace(params.placeId, userId);
  const alreadyVisited = existing?.status === "visited";

  if (existing) {
    db.update(userPlaces)
      .set({ status: params.status })
      .where(
        and(
          eq(userPlaces.userId, userId),
          eq(userPlaces.placeId, params.placeId)
        )
      )
      .run();
  } else {
    db.insert(userPlaces)
      .values({
        userId,
        placeId: params.placeId,
        status: params.status,
        rating: null,
        note: null,
      })
      .run();
  }

  if (params.status === "visited" && !alreadyVisited) {
    insertVisit({ userId, placeId: params.placeId });
  }

  return getPlaceRecord(params.placeId, userId);
}

export function addVisit(params: {
  placeId: string;
  userId?: string;
  note?: string | null;
}): PlaceRecord {
  const userId = params.userId ?? LOCAL_USER_ID;
  const existing = getUserPlace(params.placeId, userId);

  if (!existing || existing.status !== "visited") {
    throw new Error("PLACE_NOT_VISITED");
  }

  insertVisit({
    userId,
    placeId: params.placeId,
    note: params.note,
  });

  return getPlaceRecord(params.placeId, userId);
}

export function updateUserPlaceRating(params: {
  placeId: string;
  rating: number | null;
  userId?: string;
}): PlaceRecord {
  const userId = params.userId ?? LOCAL_USER_ID;
  ensureUserPlace(params.placeId, userId, "want_to_go");

  db.update(userPlaces)
    .set({ rating: params.rating })
    .where(
      and(eq(userPlaces.userId, userId), eq(userPlaces.placeId, params.placeId))
    )
    .run();

  return getPlaceRecord(params.placeId, userId);
}

export function updateUserPlaceNote(params: {
  placeId: string;
  note: string | null;
  userId?: string;
}): PlaceRecord {
  const userId = params.userId ?? LOCAL_USER_ID;
  ensureUserPlace(params.placeId, userId, "want_to_go");

  db.update(userPlaces)
    .set({ note: params.note })
    .where(
      and(eq(userPlaces.userId, userId), eq(userPlaces.placeId, params.placeId))
    )
    .run();

  return getPlaceRecord(params.placeId, userId);
}

export function addPlacePhoto(params: {
  placeId: string;
  url: string;
  userId?: string;
}): PlaceRecord {
  const userId = params.userId ?? LOCAL_USER_ID;

  db.insert(photos)
    .values({
      id: randomUUID(),
      userId,
      placeId: params.placeId,
      visitId: null,
      url: params.url,
      createdAt: new Date().toISOString(),
    })
    .run();

  return getPlaceRecord(params.placeId, userId);
}

export function listUserPlaces(userId: string = LOCAL_USER_ID) {
  return db
    .select()
    .from(userPlaces)
    .where(eq(userPlaces.userId, userId))
    .all()
    .map(mapUserPlace);
}
