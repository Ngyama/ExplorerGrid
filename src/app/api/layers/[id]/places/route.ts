import { NextResponse } from "next/server";
import { getLayerPlaces } from "@/lib/repositories/places";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const markers = getLayerPlaces(id);
  return NextResponse.json(markers);
}
