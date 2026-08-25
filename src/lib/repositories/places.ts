import { eq, and, asc } from "drizzle-orm";
import { db } from "@/data/db";
import {
  places,
  exploreLayers,
  exploreLayerPlaces,
  userPlaces,
} from "@/data/db/schema";
import { seedDatabase } from "@/data/db/seed";
import { categoryLabel, isPlaceCategory } from "@/lib/categories";
import { regionMatchesPlace } from "@/lib/geo/regions";
import { getPlaceRecord } from "@/lib/repositories/userPlaces";
import type { ExploreLayer, MapPlaceMarker } from "@/types/explore";
import type { PlaceCategory, PlaceWithStatus } from "@/types/place";
import type { CategoryExploreStat, Region } from "@/types/region";
import type { GridLayerGroup } from "@/types/user";
import { LOCAL_USER_ID, type UserPlaceStatus } from "@/types/user";

function ensureSeeded() {
  seedDatabase();
}

function asCategory(value: string): PlaceCategory {
  return isPlaceCategory(value) ? value : "landmark";
}

function layersForRegion(region: Region | null) {
  const all = db.select().from(exploreLayers).all();
  if (!region || region.type === "country") {
    return all.filter(
      (layer) => !layer.regionId || layer.regionId === "japan"
    );
  }
  if (region.type === "prefecture") {
    return all.filter(
      (layer) =>
        layer.regionId === region.id ||
        layer.regionId === "japan" ||
        !layer.regionId
    );
  }
  // ward: prefer parent prefecture curated views
  const prefId = region.parentId;
  return all.filter(
    (layer) =>
      layer.regionId === prefId ||
      layer.regionId === "japan" ||
      !layer.regionId
  );
}

export function listLayers(
  userId: string = LOCAL_USER_ID,
  region: Region | null = null
): ExploreLayer[] {
  ensureSeeded();

  return layersForRegion(region).map((layer) => {
    const rows = db
      .select({
        placeId: exploreLayerPlaces.placeId,
        status: userPlaces.status,
        regionId: places.regionId,
      })
      .from(exploreLayerPlaces)
      .innerJoin(places, eq(exploreLayerPlaces.placeId, places.id))
      .leftJoin(
        userPlaces,
        and(
          eq(userPlaces.placeId, exploreLayerPlaces.placeId),
          eq(userPlaces.userId, userId)
        )
      )
      .where(eq(exploreLayerPlaces.layerId, layer.id))
      .all();

    const scoped = region
      ? rows.filter((row) => regionMatchesPlace(row.regionId, region))
      : rows;

    return {
      id: layer.id,
      name: layer.name,
      description: layer.description,
      coverImage: layer.coverImage,
      regionId: layer.regionId,
      placeCount: scoped.length,
      visitedCount: scoped.filter((row) => row.status === "visited").length,
    };
  });
}

export function getLayerPlaces(
  layerId: string,
  userId: string = LOCAL_USER_ID,
  options?: { region?: Region | null; zoom?: number }
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
      regionId: places.regionId,
      importance: places.importance,
      minZoom: places.minZoom,
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

  const zoom = options?.zoom ?? 20;
  const region = options?.region ?? null;

  return rows
    .filter((row) => {
      const importance = row.importance ?? 3;
      const minZoom = row.minZoom ?? 10;
      if (zoom + 0.01 < minZoom) return false;
      // At very low zoom, only national landmarks.
      if (zoom < 7 && importance > 1) return false;
      if (zoom < 9 && importance > 2) return false;
      if (region && region.type !== "country" && !regionMatchesPlace(row.regionId, region)) {
        return false;
      }
      return true;
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      latitude: row.latitude,
      longitude: row.longitude,
      category: asCategory(row.category),
      status: (row.status as UserPlaceStatus | null) ?? null,
      regionId: row.regionId,
      importance: row.importance ?? 3,
      minZoom: row.minZoom ?? 10,
    }));
}

export function getRegionExploreSummary(
  layerId: string,
  region: Region,
  userId: string = LOCAL_USER_ID
): CategoryExploreStat[] {
  ensureSeeded();

  const rows = db
    .select({
      category: places.category,
      status: userPlaces.status,
      regionId: places.regionId,
    })
    .from(exploreLayerPlaces)
    .innerJoin(places, eq(exploreLayerPlaces.placeId, places.id))
    .leftJoin(
      userPlaces,
      and(eq(userPlaces.placeId, places.id), eq(userPlaces.userId, userId))
    )
    .where(eq(exploreLayerPlaces.layerId, layerId))
    .all();

  const scoped = rows.filter((row) =>
    regionMatchesPlace(row.regionId, region)
  );

  const byCategory = new Map<string, { total: number; visited: number }>();
  for (const row of scoped) {
    const key = row.category;
    const entry = byCategory.get(key) ?? { total: 0, visited: 0 };
    entry.total += 1;
    if (row.status === "visited") entry.visited += 1;
    byCategory.set(key, entry);
  }

  return Array.from(byCategory.entries())
    .map(([category, stats]) => ({
      category,
      label: categoryLabel(category),
      total: stats.total,
      visited: stats.visited,
    }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label, "zh"));
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
    regionId: place.regionId,
    importance: place.importance ?? 3,
    minZoom: place.minZoom ?? 10,
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
