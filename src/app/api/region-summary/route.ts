import { NextResponse } from "next/server";
import { getRegionExploreSummary } from "@/lib/repositories/places";
import type { Region, RegionType } from "@/types/region";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const layerId = searchParams.get("layerId");
  const collectionId = searchParams.get("collectionId");
  const regionId = searchParams.get("regionId");
  const regionType = searchParams.get("regionType") as RegionType | null;
  const regionLabel = searchParams.get("regionLabel");
  const parentId = searchParams.get("parentId");

  if ((!layerId && !collectionId) || !regionId || !regionType || !regionLabel) {
    return NextResponse.json(
      { error: "layerId/collectionId and region fields are required" },
      { status: 400 }
    );
  }

  const region: Region = {
    id: regionId,
    name: regionLabel,
    nameJa: regionLabel,
    type: regionType,
    parentId: parentId || null,
    label: regionLabel,
  };

  const categories = getRegionExploreSummary(layerId || "classic-japan", region, "local", {
    collectionId,
  });
  return NextResponse.json({
    region,
    layerId,
    collectionId,
    categories,
    placeCount: categories.reduce((sum, c) => sum + c.total, 0),
    visitedCount: categories.reduce((sum, c) => sum + c.visited, 0),
  });
}
