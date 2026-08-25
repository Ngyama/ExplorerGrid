import { NextResponse } from "next/server";
import { getLayerPlaces } from "@/lib/repositories/places";
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

  const markers = getLayerPlaces(id, "local", {
    region,
    zoom: Number.isFinite(zoom) ? zoom : 12,
  });
  return NextResponse.json(markers);
}
