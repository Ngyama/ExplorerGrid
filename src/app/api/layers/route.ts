import { NextResponse } from "next/server";
import { listLayers } from "@/lib/repositories/places";

export const runtime = "nodejs";

export async function GET() {
  const layers = listLayers();
  return NextResponse.json(layers);
}
