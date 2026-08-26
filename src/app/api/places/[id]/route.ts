import { NextResponse } from "next/server";
import { getPlaceById } from "@/lib/repositories/places";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const layerId = new URL(request.url).searchParams.get("layerId");
  const place = getPlaceById(id, "local", { layerId });
  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }
  return NextResponse.json(place);
}
