import { NextResponse } from "next/server";
import {
  addPlacePhoto,
  addVisit,
  listUserPlaces,
  updateUserPlaceNote,
  updateUserPlaceRating,
  upsertUserPlaceStatus,
} from "@/lib/repositories/userPlaces";
import type { UserPlaceStatus } from "@/types/user";

export const runtime = "nodejs";

const STATUSES: UserPlaceStatus[] = ["want_to_go", "visited"];

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const rows = listUserPlaces();
  return NextResponse.json(rows);
}

export async function PATCH(request: Request) {
  const body = (await readJson(request)) as {
    placeId?: string;
    status?: UserPlaceStatus;
    rating?: number | null;
    note?: string | null;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  if (!body.placeId) {
    return NextResponse.json({ error: "缺少地点" }, { status: 400 });
  }

  const hasStatus = body.status !== undefined;
  const hasRating = body.rating !== undefined;
  const hasNote = body.note !== undefined;

  if (!hasStatus && !hasRating && !hasNote) {
    return NextResponse.json(
      { error: "需要提供状态、评分或感想" },
      { status: 400 }
    );
  }

  try {
    let record = null;

    if (hasStatus) {
      if (!STATUSES.includes(body.status as UserPlaceStatus)) {
        return NextResponse.json({ error: "状态无效" }, { status: 400 });
      }
      record = upsertUserPlaceStatus({
        placeId: body.placeId,
        status: body.status as UserPlaceStatus,
      });
    }

    if (hasRating) {
      if (
        body.rating !== null &&
        (typeof body.rating !== "number" ||
          !Number.isInteger(body.rating) ||
          body.rating < 1 ||
          body.rating > 10)
      ) {
        return NextResponse.json(
          { error: "评分需为 1 到 10 的整数" },
          { status: 400 }
        );
      }
      record = updateUserPlaceRating({
        placeId: body.placeId,
        rating: body.rating ?? null,
      });
    }

    if (hasNote) {
      const note =
        typeof body.note === "string" ? body.note.trim().slice(0, 2000) : null;
      record = updateUserPlaceNote({
        placeId: body.placeId,
        note: note === "" ? null : note,
      });
    }

    return NextResponse.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const body = (await readJson(request)) as {
    placeId?: string;
    action?: "visit" | "photo";
    url?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  if (!body.placeId) {
    return NextResponse.json({ error: "缺少地点" }, { status: 400 });
  }

  try {
    if (body.action === "photo") {
      const url = body.url?.trim() ?? "";
      if (!url || url.length > 2000 || !isHttpUrl(url)) {
        return NextResponse.json(
          { error: "请输入有效的图片链接" },
          { status: 400 }
        );
      }
      const record = addPlacePhoto({ placeId: body.placeId, url });
      return NextResponse.json(record);
    }

    if (body.action === "visit" || body.action === undefined) {
      const record = addVisit({ placeId: body.placeId });
      return NextResponse.json(record);
    }

    return NextResponse.json({ error: "无法识别的操作" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    if (message === "PLACE_NOT_VISITED") {
      return NextResponse.json(
        { error: "请先标记为去过，再记录访问" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
