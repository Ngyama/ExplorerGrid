import { NextResponse } from "next/server";
import { getGrid } from "@/lib/repositories/places";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const regionId = searchParams.get("regionId");
  const grid = getGrid("local", { regionId });
  return NextResponse.json(grid);
}
