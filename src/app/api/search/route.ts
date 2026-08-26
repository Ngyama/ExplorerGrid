import { NextResponse } from "next/server";
import { searchExternalPlaces } from "@/lib/providers/places";
import { searchPlacesLocal } from "@/lib/repositories/places";
import { findPlaceIdByExternal } from "@/lib/repositories/placeUpsert";
import type { PlaceSearchHit } from "@/lib/providers/places/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] as PlaceSearchHit[] });
  }

  const local = searchPlacesLocal(q, 10);
  const results: PlaceSearchHit[] = local.map((row) => ({
    kind: "place",
    placeId: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    category: row.category,
    regionId: row.regionId,
  }));

  const localNames = new Set(local.map((row) => row.name.toLowerCase()));

  try {
    const external = await searchExternalPlaces(q, 8);
    for (const candidate of external) {
      const existingId = findPlaceIdByExternal(
        candidate.provider,
        candidate.externalId
      );
      if (existingId) {
        if (!results.some((r) => r.placeId === existingId)) {
          results.push({
            kind: "place",
            placeId: existingId,
            name: candidate.name,
            latitude: candidate.latitude,
            longitude: candidate.longitude,
            category: candidate.category,
          });
        }
        continue;
      }
      if (localNames.has(candidate.name.toLowerCase())) continue;
      results.push({
        kind: "external",
        external: candidate,
        name: candidate.name,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        category: candidate.category,
      });
    }
  } catch (err) {
    console.warn("[api/search] external failed", err);
  }

  return NextResponse.json({ results: results.slice(0, 16) });
}
