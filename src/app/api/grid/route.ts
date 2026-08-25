import { NextResponse } from "next/server";
import { getGrid } from "@/lib/repositories/places";

export const runtime = "nodejs";

export async function GET() {
  const grid = getGrid();
  return NextResponse.json(grid);
}
