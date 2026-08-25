"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CategoryIcon } from "@/components/CategoryIcon";
import { StatusDot } from "@/components/StatusDot";
import {
  NoteEditor,
  PhotoGallery,
  RatingPicker,
} from "@/features/places/PlaceRecordFields";
import { categoryLabel } from "@/lib/categories";
import { formatCoord, formatVisitDate } from "@/lib/dates";
import type { PlaceWithStatus } from "@/types/place";
import type { PlaceRecord, UserPlaceStatus } from "@/types/user";

interface PlaceDetailProps {
  place: PlaceWithStatus;
}

function applyRecord(
  current: PlaceWithStatus,
  record: PlaceRecord
): PlaceWithStatus {
  return { ...current, ...record };
}

export function PlaceDetail({ place }: PlaceDetailProps) {
  const router = useRouter();
  const [data, setData] = useState(place);
  const [note, setNote] = useState(place.note ?? "");
  const [pending, setPending] = useState<string | null>(null);
  const [confirmVisit, setConfirmVisit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(place);
    setNote(place.note ?? "");
  }, [place]);

  const status = data.status;
  const visits = data.visits;
  const firstVisit = visits.at(-1);
  const lastVisit = visits[0];

  async function mutate(
    key: string,
    request: Promise<Response>
  ): Promise<PlaceRecord | null> {
    setPending(key);
    setError(null);
    try {
      const res = await request;
      const payload = (await res.json()) as PlaceRecord & { error?: string };
      if (!res.ok) throw new Error(payload.error ?? "更新失败");
      setData((current) => applyRecord(current, payload));
      if (payload.note !== undefined) setNote(payload.note ?? "");
      router.refresh();
      return payload;
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
      return null;
    } finally {
      setPending(null);
    }
  }

  function patch(body: Record<string, unknown>, key: string) {
    return mutate(
      key,
      fetch("/api/user-places", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: data.id, ...body }),
      })
    );
  }

  function post(body: Record<string, unknown>, key: string) {
    return mutate(
      key,
      fetch("/api/user-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: data.id, ...body }),
      })
    );
  }

  async function updateStatus(next: UserPlaceStatus) {
    await patch({ status: next }, next);
  }

  async function recordVisit() {
    if (!confirmVisit) {
      setConfirmVisit(true);
      return;
    }
    const result = await post({ action: "visit" }, "visit");
    if (result) setConfirmVisit(false);
  }

  return (
    <article className="mx-auto min-h-[100dvh] max-w-3xl px-4 pb-16 pt-24 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/" className="text-[var(--muted)] hover:text-[var(--ink)]">
          ← 返回地图
        </Link>
        <Link href="/grid" className="text-[var(--muted)] hover:text-[var(--ink)]">
          图鉴
        </Link>
      </div>

      <section>
        <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-sm bg-[var(--accent-soft)]">
          <Image
            src={data.image}
            alt={data.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
            {data.name}
          </h1>
          <StatusDot status={status} />
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-white/60 px-2 py-1">
            <CategoryIcon category={data.category} size={14} />
            {categoryLabel(data.category)}
          </span>
          {data.layers.map((layer) => (
            <span
              key={layer.id}
              className="rounded-sm bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent)]"
            >
              {layer.name}
            </span>
          ))}
        </div>

        <p className="mb-4 max-w-2xl leading-7 text-[var(--ink)]/90">
          {data.description}
        </p>

        <p className="text-sm text-[var(--muted)]">
          {formatCoord(data.latitude, data.longitude)}
        </p>
      </section>

      <section className="mt-10 rounded-sm border border-[var(--line)] bg-white/40 p-4 sm:p-6">
        <header className="mb-5 border-b border-[var(--line)] pb-3">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            我的记录
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            这里只留下你和这个地点的关系，不是任务清单。
          </p>
        </header>

        <div className="mb-6">
          <div className="mb-3 text-xs tracking-wide text-[var(--muted)]">
            状态
          </div>
          {status === "visited" ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-sm bg-[var(--visited)]/12 px-3 py-2 text-sm text-[var(--visited)]">
                已去过
              </span>
              <button
                type="button"
                disabled={pending !== null}
                onClick={recordVisit}
                className="rounded-sm border border-[var(--line)] bg-white px-4 py-2 text-sm transition hover:bg-[var(--accent-soft)] disabled:opacity-50"
              >
                {pending === "visit"
                  ? "记录中…"
                  : confirmVisit
                    ? "确认记录这次访问"
                    : "记录再次访问"}
              </button>
              {confirmVisit && pending !== "visit" && (
                <button
                  type="button"
                  onClick={() => setConfirmVisit(false)}
                  className="text-sm text-[var(--muted)]"
                >
                  取消
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={pending !== null || status === "want_to_go"}
                onClick={() => updateStatus("want_to_go")}
                className="rounded-sm border border-[var(--line)] bg-white px-4 py-2 text-sm transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending === "want_to_go"
                  ? "保存中…"
                  : status === "want_to_go"
                    ? "已列入想去"
                    : "想去"}
              </button>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => updateStatus("visited")}
                className="rounded-sm bg-[var(--accent)] px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {pending === "visited" ? "保存中…" : "标记为去过"}
              </button>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="mb-3 text-xs tracking-wide text-[var(--muted)]">
            访问
          </div>
          {visits.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">还没有访问记录。</p>
          ) : (
            <div>
              <p className="mb-2 text-sm">
                访问 {visits.length} 次
                {firstVisit && lastVisit ? (
                  <span className="text-[var(--muted)]">
                    {" "}
                    · 首次 {formatVisitDate(firstVisit.visitedAt)}
                    {visits.length > 1
                      ? ` · 最近 ${formatVisitDate(lastVisit.visitedAt)}`
                      : ""}
                  </span>
                ) : null}
              </p>
              <ul className="space-y-1 text-sm text-[var(--ink)]/85">
                {visits.map((visit) => (
                  <li key={visit.id}>{formatVisitDate(visit.visitedAt)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="mb-3 text-xs tracking-wide text-[var(--muted)]">
            评分
          </div>
          <RatingPicker
            value={data.rating}
            disabled={pending !== null}
            onChange={(rating) => patch({ rating }, "rating")}
          />
        </div>

        <div className="mb-6">
          <div className="mb-3 text-xs tracking-wide text-[var(--muted)]">
            感想
          </div>
          <NoteEditor
            value={note}
            pending={pending === "note"}
            onChange={setNote}
            onSave={() => patch({ note }, "note")}
          />
        </div>

        <div>
          <div className="mb-3 text-xs tracking-wide text-[var(--muted)]">
            照片
          </div>
          <PhotoGallery
            photos={data.photos}
            pending={pending === "photo"}
            onAdd={async (url) => {
              const result = await post({ action: "photo", url }, "photo");
              if (!result) throw new Error("添加失败");
            }}
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      </section>
    </article>
  );
}
