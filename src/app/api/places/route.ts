import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/data/db";
import { exploreLayerPlaces } from "@/data/db/schema";
import { isPlaceCategory } from "@/lib/categories";
import {
  createCustomPlace,
  upsertFromExternalCandidate,
} from "@/lib/repositories/placeUpsert";
import { getPlaceById } from "@/lib/repositories/places";
import type { ExternalPlaceCandidate } from "@/lib/providers/places/types";
import type { PlaceCategory } from "@/types/place";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: "custom" | "import-external";
    name?: string;
    category?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    external?: ExternalPlaceCandidate;
    layerId?: string;
  };

  if (body.action === "import-external") {
    if (!body.external?.provider || !body.external.externalId) {
      return NextResponse.json(
        { error: "external candidate required" },
        { status: 400 }
      );
    }
    const { placeId, created } = upsertFromExternalCandidate(body.external, {
      sourceType: "imported",
      importance: 3,
      layerIds: body.layerId ? [body.layerId] : ["classic-tokyo"],
    });
    const place = getPlaceById(placeId);
    return NextResponse.json({ place, created }, { status: created ? 201 : 200 });
  }

  if (
    !body.name?.trim() ||
    typeof body.latitude !== "number" ||
    typeof body.longitude !== "number"
  ) {
    return NextResponse.json(
      { error: "name, latitude, longitude required" },
      { status: 400 }
    );
  }

  const category = (
    body.category && isPlaceCategory(body.category)
      ? body.category
      : "other"
  ) as PlaceCategory;

  const placeId = createCustomPlace({
    name: body.name,
    category,
    description: body.description,
    latitude: body.latitude,
    longitude: body.longitude,
  });

  if (body.layerId) {
    const exists = db
      .select()
      .from(exploreLayerPlaces)
      .where(
        and(
          eq(exploreLayerPlaces.layerId, body.layerId),
          eq(exploreLayerPlaces.placeId, placeId)
        )
      )
      .get();
    if (!exists) {
      db.insert(exploreLayerPlaces)
        .values({
          layerId: body.layerId,
          placeId,
          priority: 0,
          order: 999,
          note: null,
        })
        .run();
    }
  }

  const place = getPlaceById(placeId);
  return NextResponse.json({ place }, { status: 201 });
}
