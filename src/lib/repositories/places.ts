import { eq, and, asc } from "drizzle-orm";
import { db } from "@/data/db";
import {
  places,
  exploreLayers,
  exploreLayerPlaces,
  userPlaces,
} from "@/data/db/schema";
import { seedDatabase } from "@/data/db/seed";
import type { ExploreLayer, MapPlaceMarker } from "@/types/explore";
import type { PlaceWithStatus } from "@/types/place";
import type { GridLayerGroup } from "@/types/user";
import { LOCAL_USER_ID, type UserPlaceStatus } from "@/types/user";

function ensureSeeded() {
  seedDatabase();
}

export function listLayers(): ExploreLayer[] {
  ensureSeeded();
  return db
    .select()
    .from(exploreLayers)
    .all()
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      coverImage: row.coverImage,
    }));
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
    category: row.category,
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

  const statusRow = db
    .select()
    .from(userPlaces)
    .where(
      and(eq(userPlaces.placeId, placeId), eq(userPlaces.userId, userId))
    )
    .get();

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

  return {
    id: place.id,
    name: place.name,
    description: place.description,
    latitude: place.latitude,
    longitude: place.longitude,
    category: place.category as PlaceWithStatus["category"],
    image: place.image,
    status: (statusRow?.status as UserPlaceStatus | null) ?? null,
    layers,
  };
}

export function getGrid(userId: string = LOCAL_USER_ID): GridLayerGroup[] {
  ensureSeeded();

  const layers = listLayers();

  return layers.map((layer) => {
    const rows = db
      .select({
        id: places.id,
        name: places.name,
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
        status: (row.status as UserPlaceStatus | null) ?? null,
      })),
    };
  });
}
