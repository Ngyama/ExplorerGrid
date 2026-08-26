import { NextResponse } from "next/server";
import {
  batchReviewPlaces,
  getReviewStats,
  listReviewPlaces,
  refreshDuplicateCandidates,
  updateReviewPlace,
  type ReviewSort,
} from "@/lib/repositories/review";
import type { PlaceReviewStatus } from "@/types/place";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("stats") === "1") {
    return NextResponse.json(getReviewStats("tokyo"));
  }
  if (searchParams.get("dedupe") === "1") {
    const linked = refreshDuplicateCandidates("ward-13");
    return NextResponse.json({ linked });
  }

  const result = listReviewPlaces({
    regionId: searchParams.get("regionId"),
    category: searchParams.get("category"),
    importance: searchParams.get("importance")
      ? Number(searchParams.get("importance"))
      : null,
    sourceType: searchParams.get("sourceType"),
    reviewStatus:
      (searchParams.get("reviewStatus") as PlaceReviewStatus | "all") ||
      "pending",
    layerId: searchParams.get("layerId"),
    provider: searchParams.get("provider"),
    q: searchParams.get("q"),
    sort: (searchParams.get("sort") as ReviewSort) || "priority",
    limit: Number(searchParams.get("limit") ?? 80),
    offset: Number(searchParams.get("offset") ?? 0),
  });
  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    placeId?: string;
    placeIds?: string[];
    reviewStatus?: PlaceReviewStatus;
    category?: string;
    importance?: number;
    name?: string;
    description?: string;
    regionId?: string | null;
    nameJa?: string | null;
    nameEn?: string | null;
    addLayerId?: string;
    removeLayerId?: string;
    layerNote?: string | null;
  };

  if (body.placeIds?.length) {
    const result = batchReviewPlaces({
      placeIds: body.placeIds,
      reviewStatus: body.reviewStatus,
      category: body.category,
      importance: body.importance,
      addLayerId: body.addLayerId,
      removeLayerId: body.removeLayerId,
      layerNote: body.layerNote,
    });
    return NextResponse.json(result);
  }

  if (!body.placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }

  const updated = updateReviewPlace(body.placeId, {
    reviewStatus: body.reviewStatus,
    category: body.category,
    importance: body.importance,
    name: body.name,
    description: body.description,
    regionId: body.regionId,
    nameJa: body.nameJa,
    nameEn: body.nameEn,
  });

  if (!updated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (body.addLayerId || body.removeLayerId) {
    batchReviewPlaces({
      placeIds: [body.placeId],
      addLayerId: body.addLayerId,
      removeLayerId: body.removeLayerId,
      layerNote: body.layerNote,
    });
  }

  return NextResponse.json(updated);
}
