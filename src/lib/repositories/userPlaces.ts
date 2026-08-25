import { and, eq } from "drizzle-orm";
import { db } from "@/data/db";
import { userPlaces, visits } from "@/data/db/schema";
import { LOCAL_USER_ID, type UserPlaceStatus } from "@/types/user";
import { randomUUID } from "crypto";

export function upsertUserPlaceStatus(params: {
  placeId: string;
  status: UserPlaceStatus;
  userId?: string;
  note?: string | null;
}) {
  const userId = params.userId ?? LOCAL_USER_ID;

  const existing = db
    .select()
    .from(userPlaces)
    .where(
      and(
        eq(userPlaces.userId, userId),
        eq(userPlaces.placeId, params.placeId)
      )
    )
    .get();

  if (existing) {
    db.update(userPlaces)
      .set({
        status: params.status,
        note: params.note ?? existing.note,
      })
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
        note: params.note ?? null,
      })
      .run();
  }

  if (params.status === "visited") {
    db.insert(visits)
      .values({
        id: randomUUID(),
        userId,
        placeId: params.placeId,
        visitedAt: new Date().toISOString(),
        note: params.note ?? null,
      })
      .run();
  }

  return {
    userId,
    placeId: params.placeId,
    status: params.status,
  };
}

export function listUserPlaces(userId: string = LOCAL_USER_ID) {
  return db
    .select()
    .from(userPlaces)
    .where(eq(userPlaces.userId, userId))
    .all();
}
