import { NextResponse } from "next/server";
import { listUserPlaces, upsertUserPlaceStatus } from "@/lib/repositories/userPlaces";
import type { UserPlaceStatus } from "@/types/user";

export const runtime = "nodejs";

export async function GET() {
  const rows = listUserPlaces();
  return NextResponse.json(rows);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    placeId?: string;
    status?: UserPlaceStatus;
    note?: string | null;
  };

  if (!body.placeId || !body.status) {
    return NextResponse.json(
      { error: "placeId and status are required" },
      { status: 400 }
    );
  }

  if (body.status !== "want_to_go" && body.status !== "visited") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = upsertUserPlaceStatus({
    placeId: body.placeId,
    status: body.status,
    note: body.note ?? null,
  });

  return NextResponse.json(result);
}
