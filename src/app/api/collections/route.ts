import { NextResponse } from "next/server";
import {
  addPlaceToCollection,
  createCollection,
  listCollections,
} from "@/lib/repositories/collections";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(listCollections());
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    placeId?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const collection = createCollection({
    name: body.name,
    description: body.description,
  });

  if (body.placeId) {
    addPlaceToCollection(collection.id, body.placeId);
    collection.placeCount = 1;
  }

  return NextResponse.json(collection, { status: 201 });
}
