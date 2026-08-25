import { NextResponse } from "next/server";
import { getPlaceById } from "@/lib/repositories/places";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const place = getPlaceById(id);
  if (!place) {
    return NextResponse.json({ error: "Place not found" }, { status: 404 });
  }
  return NextResponse.json(place);
}
