import { NextResponse } from "next/server";
import { listLayers } from "@/lib/repositories/places";
import type { Region, RegionType } from "@/types/region";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
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

  const layers = listLayers("local", region);
  return NextResponse.json(layers);
}
