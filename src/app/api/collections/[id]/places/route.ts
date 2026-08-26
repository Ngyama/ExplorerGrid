import { NextResponse } from "next/server";
import {
  addPlaceToCollection,
  getCollectionPlaces,
  removePlaceFromCollection,
} from "@/lib/repositories/collections";
import type { Region, RegionType } from "@/types/region";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const zoom = Number(searchParams.get("zoom") ?? "12");
  const regionId = searchParams.get("regionId");
  const regionType = searchParams.get("regionType") as RegionType | null;
  const regionLabel = searchParams.get("regionLabel");
  const parentId = searchParams.get("parentId");
  const categoriesRaw = searchParams.get("categories");
  const categories = categoriesRaw
    ? categoriesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const region: Region | null =
    regionId && regionType && regionLabel
      ? {
          id: regionId,
          name: regionLabel,
          nameJa: regionLabel,
          type: regionType,
          parentId: parentId || null,
          label: regionLabel,
        }
      : null;

  const markers = getCollectionPlaces(id, "local", {
    region,
    zoom: Number.isFinite(zoom) ? zoom : 12,
    categories,
  });
  return NextResponse.json(markers);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = (await request.json()) as { placeId?: string; note?: string };
  if (!body.placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }
  addPlaceToCollection(id, body.placeId, body.note);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");
  if (!placeId) {
    return NextResponse.json({ error: "placeId required" }, { status: 400 });
  }
  removePlaceFromCollection(id, placeId);
  return NextResponse.json({ ok: true });
}
