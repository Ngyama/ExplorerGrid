import { NextResponse } from "next/server";
import {
  buildConquestChomeGeoJSON,
  buildConquestWardGeoJSON,
  computeConquestProgress,
} from "@/lib/repositories/conquest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const layerId = searchParams.get("layerId");
  const collectionId = searchParams.get("collectionId");

  if (!layerId && !collectionId) {
    return NextResponse.json(
      { error: "layerId or collectionId required" },
      { status: 400 }
    );
  }

  // Collection conquest uses same layer semantics via collection places — defer to layer for MVP.
  const id = layerId ?? "classic-tokyo";
  const progress = computeConquestProgress(id);
  const chomeGeoJSON = buildConquestChomeGeoJSON(progress.chomes);
  const wardGeoJSON = buildConquestWardGeoJSON(progress.wards);

  return NextResponse.json({
    layerId: id,
    chomes: progress.chomes,
    wards: progress.wards,
    chomeGeoJSON,
    wardGeoJSON,
  });
}
