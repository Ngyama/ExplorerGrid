import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/data/db";
import { exploreLayers, places } from "@/data/db/schema";
import { ensureExploreLayer } from "@/lib/repositories/placeUpsert";
import {
  draftViewNote,
  setPlaceLayerNote,
  suggestViewCandidates,
  updateExploreView,
} from "@/lib/repositories/review";

export const runtime = "nodejs";

const TOKYO_VIEWS = [
  {
    id: "classic-tokyo",
    name: "经典东京",
    description: "第一次来东京必访的地标与名所，点亮城市的骨架。",
    coverImage:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "museum-tokyo",
    name: "博物馆东京",
    description: "从国立博物馆到设计与科技展馆，雨天也能探索的文化地图。",
    coverImage:
      "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "literary-tokyo",
    name: "文学东京",
    description: "夏目漱石、森鸥外与神保町——文字留下的城市足迹。",
    coverImage:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "gardens-shrines-tokyo",
    name: "庭园与寺社",
    description: "神社、寺院与庭园——东京节奏里的静谧一侧。",
    coverImage:
      "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "modern-architecture-tokyo",
    name: "现代建筑东京",
    description: "塔、广场与城市综合体——战后东京的空间实验。",
    coverImage:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "tokyo-skyline",
    name: "东京城市展望",
    description: "从塔顶与高层俯瞰东京盆地的不同高度。",
    coverImage:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "rainy-tokyo",
    name: "雨天东京",
    description: "博物馆、书店与咖啡馆——适合雨天的室内探索。",
    coverImage:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "waterfront-tokyo",
    name: "水边东京",
    description: "隅田川、台场与港口——东京面向水的一面。",
    coverImage:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "bookstore-tokyo",
    name: "书店与出版文化",
    description: "神保町到早稻田——旧书、独立书店与出版街的东京。",
    coverImage:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
    regionId: "pref-13",
  },
  {
    id: "showa-tokyo",
    name: "昭和东京",
    description: "下町、商店街与战后日常景观——仍留在街角的昭和气味。",
    coverImage:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    regionId: "pref-13",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const layerId = searchParams.get("layerId");
  if (layerId && searchParams.get("candidates") === "1") {
    return NextResponse.json({
      candidates: suggestViewCandidates(layerId),
    });
  }
  return NextResponse.json(db.select().from(exploreLayers).all());
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action?: string };
  if (body.action === "ensure-tokyo-views") {
    for (const layer of TOKYO_VIEWS) {
      ensureExploreLayer(layer);
    }
    return NextResponse.json({ ok: true, count: TOKYO_VIEWS.length });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    layerId?: string;
    name?: string;
    description?: string;
    regionId?: string | null;
    coverImage?: string;
    visibility?: string;
    placeId?: string;
    note?: string | null;
    draftNote?: boolean;
  };

  if (!body.layerId) {
    return NextResponse.json({ error: "layerId required" }, { status: 400 });
  }

  if (body.placeId && (body.note !== undefined || body.draftNote)) {
    let note = body.note ?? null;
    if (body.draftNote) {
      const place = db
        .select()
        .from(places)
        .where(eq(places.id, body.placeId))
        .get();
      note = draftViewNote(place?.name ?? "地点", body.layerId);
    }
    setPlaceLayerNote(body.layerId, body.placeId, note);
    return NextResponse.json({ ok: true, note });
  }

  const updated = updateExploreView(body.layerId, {
    name: body.name,
    description: body.description,
    regionId: body.regionId,
    coverImage: body.coverImage,
    visibility: body.visibility,
  });
  return NextResponse.json(updated);
}
