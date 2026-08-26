import fs from "fs";
import path from "path";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/data/db";
import { exploreLayerPlaces, places, userPlaces } from "@/data/db/schema";
import { seedDatabase } from "@/data/db/seed";
import { assignPlaceToChomeId, type ChomeFeature } from "@/lib/geo/chome";
import {
  chomeStatusFromCounts,
  wardConquered,
  type ChomeProgress,
  type WardProgress,
} from "@/lib/map/conquest";
import { CONQUEST_CONFIG } from "@/lib/map/conquest";
import { LOCAL_USER_ID } from "@/types/user";
import type { RegionFeatureCollection } from "@/lib/geo/regions";

let chomeFeaturesCache: ChomeFeature[] | null = null;

function ensureSeeded() {
  seedDatabase();
}

function getChomeFeatures(): ChomeFeature[] {
  if (chomeFeaturesCache) return chomeFeaturesCache;
  const filePath = path.join(process.cwd(), "public/geo/tokyo-chome.json");
  const raw = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  ) as GeoJSON.FeatureCollection;
  chomeFeaturesCache = raw.features as ChomeFeature[];
  return chomeFeaturesCache;
}

type PlaceRow = {
  id: string;
  latitude: number;
  longitude: number;
  regionId: string | null;
  importance: number | null;
  status: string | null;
};

function getEligibleLayerPlaces(
  layerId: string,
  userId: string = LOCAL_USER_ID
): PlaceRow[] {
  ensureSeeded();
  const rows = db
    .select({
      id: places.id,
      latitude: places.latitude,
      longitude: places.longitude,
      regionId: places.regionId,
      importance: places.importance,
      status: userPlaces.status,
      reviewStatus: places.reviewStatus,
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

  return rows.filter(
    (row) =>
      (!row.reviewStatus || row.reviewStatus === "approved") &&
      (row.regionId === "pref-13" || row.regionId?.startsWith("ward-13")) &&
      (row.importance ?? 3) <= CONQUEST_CONFIG.wardMaxImportance
  );
}

export function computeConquestProgress(
  layerId: string,
  userId: string = LOCAL_USER_ID
): {
  chomes: ChomeProgress[];
  wards: WardProgress[];
} {
  const chomeFeatures = getChomeFeatures();
  const placeRows = getEligibleLayerPlaces(layerId, userId);

  const chomeTotals = new Map<string, number>();
  const chomeVisited = new Map<string, number>();
  const wardTotals = new Map<string, number>();
  const wardVisited = new Map<string, number>();

  for (const chome of chomeFeatures) {
    chomeTotals.set(chome.properties.id, 0);
    chomeVisited.set(chome.properties.id, 0);
  }

  for (const place of placeRows) {
    const chomeId = assignPlaceToChomeId(
      place.longitude,
      place.latitude,
      chomeFeatures
    );
    const wardId =
      place.regionId?.startsWith("ward-") ? place.regionId : null;

    if (chomeId) {
      chomeTotals.set(chomeId, (chomeTotals.get(chomeId) ?? 0) + 1);
      if (place.status === "visited") {
        chomeVisited.set(chomeId, (chomeVisited.get(chomeId) ?? 0) + 1);
      }
    }

    if (wardId) {
      wardTotals.set(wardId, (wardTotals.get(wardId) ?? 0) + 1);
      if (place.status === "visited") {
        wardVisited.set(wardId, (wardVisited.get(wardId) ?? 0) + 1);
      }
    }
  }

  const chomes: ChomeProgress[] = chomeFeatures.map((chome) => {
    const id = chome.properties.id;
    const total = chomeTotals.get(id) ?? 0;
    const visited = chomeVisited.get(id) ?? 0;
    const ratio = total > 0 ? visited / total : 0;
    return {
      id,
      wardId: chome.properties.wardId,
      visited,
      total,
      ratio,
      status: chomeStatusFromCounts(visited, total),
    };
  });

  const wardIds = new Set(chomeFeatures.map((c) => c.properties.wardId));
  const wards: WardProgress[] = [...wardIds].map((wardId) => {
    const total = wardTotals.get(wardId) ?? 0;
    const visited = wardVisited.get(wardId) ?? 0;
    const ratio = total > 0 ? visited / total : 0;
    return {
      wardId,
      visited,
      total,
      ratio,
      conquered: wardConquered(visited, total),
    };
  });

  return { chomes, wards };
}

export function buildConquestChomeGeoJSON(
  progress: ChomeProgress[]
): GeoJSON.FeatureCollection {
  const chomeFeatures = getChomeFeatures();
  const byId = new Map(progress.map((p) => [p.id, p]));

  return {
    type: "FeatureCollection",
    features: chomeFeatures.map((chome) => {
      const p = byId.get(chome.properties.id);
      return {
        type: "Feature" as const,
        id: chome.properties.id,
        properties: {
          id: chome.properties.id,
          wardId: chome.properties.wardId,
          status: p?.status ?? "untouched",
          visited: p?.visited ?? 0,
          total: p?.total ?? 0,
          ratio: p?.ratio ?? 0,
        },
        geometry: chome.geometry,
      };
    }),
  };
}

export function buildConquestWardGeoJSON(
  progress: WardProgress[]
): GeoJSON.FeatureCollection {
  const wardsPath = path.join(process.cwd(), "public/geo/tokyo-wards.json");
  const raw = JSON.parse(
    fs.readFileSync(wardsPath, "utf8")
  ) as RegionFeatureCollection;
  const byId = new Map(progress.map((p) => [p.wardId, p]));

  return {
    type: "FeatureCollection",
    features: raw.features.map((ward) => {
      const p = byId.get(ward.properties.id);
      return {
        type: "Feature" as const,
        id: ward.properties.id,
        properties: {
          id: ward.properties.id,
          nameJa: ward.properties.nameJa,
          visited: p?.visited ?? 0,
          total: p?.total ?? 0,
          ratio: p?.ratio ?? 0,
          conquered: p?.conquered ? 1 : 0,
        },
        geometry: ward.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
      };
    }),
  };
}
