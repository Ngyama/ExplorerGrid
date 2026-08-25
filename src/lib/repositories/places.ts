import { eq, and, asc } from "drizzle-orm";
import { db } from "@/data/db";
import {
  places,
  exploreLayers,
  exploreLayerPlaces,
  userPlaces,
} from "@/data/db/schema";
import { seedDatabase } from "@/data/db/seed";
import { isPlaceCategory } from "@/lib/categories";
import { getPlaceRecord } from "@/lib/repositories/userPlaces";
import type { ExploreLayer, MapPlaceMarker } from "@/types/explore";
import type { PlaceCategory, PlaceWithStatus } from "@/types/place";
import type { GridLayerGroup } from "@/types/user";
import { LOCAL_USER_ID, type UserPlaceStatus } from "@/types/user";

function ensureSeeded() {
  seedDatabase();
}

function asCategory(value: string): PlaceCategory {
  return isPlaceCategory(value) ? value : "landmark";
}

export function listLayers(
  userId: string = LOCAL_USER_ID
): ExploreLayer[] {
  ensureSeeded();

  return db
    .select()
    .from(exploreLayers)
    .all()
    .map((layer) => {
      const rows = db
        .select({
          placeId: exploreLayerPlaces.placeId,
          status: userPlaces.status,
        })
        .from(exploreLayerPlaces)
        .leftJoin(
          userPlaces,
          and(
            eq(userPlaces.placeId, exploreLayerPlaces.placeId),
            eq(userPlaces.userId, userId)
          )
        )
        .where(eq(exploreLayerPlaces.layerId, layer.id))
        .all();

      return {
        id: layer.id,
        name: layer.name,
        description: layer.description,
        coverImage: layer.coverImage,
        placeCount: rows.length,
        visitedCount: rows.filter((row) => row.status === "visited").length,
      };
    });
}

export function getLayerPlaces(
  layerId: string,
  userId: string = LOCAL_USER_ID
): MapPlaceMarker[] {
  ensureSeeded();

  const rows = db
    .select({
      id: places.id,
      name: places.name,
      latitude: places.latitude,
      longitude: places.longitude,
      category: places.category,
      status: userPlaces.status,
      order: exploreLayerPlaces.order,
    })
    .from(exploreLayerPlaces)
    .innerJoin(places, eq(exploreLayerPlaces.placeId, places.id))
    .leftJoin(
      userPlaces,
      and(eq(userPlaces.placeId, places.id), eq(userPlaces.userId, userId))
    )
    .where(eq(exploreLayerPlaces.layerId, layerId))
    .orderBy(asc(exploreLayerPlaces.order))
    .all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    category: asCategory(row.category),
    status: (row.status as UserPlaceStatus | null) ?? null,
  }));
}

export function getPlaceById(
  placeId: string,
  userId: string = LOCAL_USER_ID
): PlaceWithStatus | null {
  ensureSeeded();

  const place = db.select().from(places).where(eq(places.id, placeId)).get();
  if (!place) return null;

  const layers = db
    .select({
      id: exploreLayers.id,
      name: exploreLayers.name,
    })
    .from(exploreLayerPlaces)
    .innerJoin(
      exploreLayers,
      eq(exploreLayerPlaces.layerId, exploreLayers.id)
    )
    .where(eq(exploreLayerPlaces.placeId, placeId))
    .all();

  const record = getPlaceRecord(placeId, userId);

  return {
    id: place.id,
    name: place.name,
    description: place.description,
    latitude: place.latitude,
    longitude: place.longitude,
    category: asCategory(place.category),
    image: place.image,
    layers,
    ...record,
  };
}

export function getGrid(userId: string = LOCAL_USER_ID): GridLayerGroup[] {
  ensureSeeded();

  const layers = listLayers(userId);

  return layers.map((layer) => {
    const rows = db
      .select({
        id: places.id,
        name: places.name,
        image: places.image,
        category: places.category,
        status: userPlaces.status,
        order: exploreLayerPlaces.order,
      })
      .from(exploreLayerPlaces)
      .innerJoin(places, eq(exploreLayerPlaces.placeId, places.id))
      .leftJoin(
        userPlaces,
        and(eq(userPlaces.placeId, places.id), eq(userPlaces.userId, userId))
      )
      .where(eq(exploreLayerPlaces.layerId, layer.id))
      .orderBy(asc(exploreLayerPlaces.order))
      .all();

    return {
      layerId: layer.id,
      layerName: layer.name,
      places: rows.map((row) => ({
        id: row.id,
        name: row.name,
        image: row.image,
        category: asCategory(row.category),
        status: (row.status as UserPlaceStatus | null) ?? null,
      })),
    };
  });
}
