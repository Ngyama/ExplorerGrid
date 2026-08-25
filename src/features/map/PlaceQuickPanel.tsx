"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import { StatusDot } from "@/components/StatusDot";
import {
  NoteEditor,
  RatingPicker,
} from "@/features/places/PlaceRecordFields";
import { categoryLabel } from "@/lib/categories";
import type { PlaceWithStatus } from "@/types/place";
import type { PlaceRecord, UserPlaceStatus } from "@/types/user";

interface PlaceQuickPanelProps {
  place: PlaceWithStatus;
  onClose: () => void;
  onRecordChange: (placeId: string, record: PlaceRecord) => void;
}

export function PlaceQuickPanel({
  place,
  onClose,
  onRecordChange,
}: PlaceQuickPanelProps) {
  const [data, setData] = useState(place);
  const [note, setNote] = useState(place.note ?? "");
  const [pending, setPending] = useState<string | null>(null);
  const [confirmVisit, setConfirmVisit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(place);
    setNote(place.note ?? "");
    setConfirmVisit(false);
    setError(null);
  }, [place]);

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
      setData((current) => ({ ...current, ...payload }));
      if (payload.note !== undefined) setNote(payload.note ?? "");
      onRecordChange(place.id, payload);
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
    <section className="eg-side-panel flex max-h-[78dvh] flex-col overflow-hidden rounded-sm border border-[var(--line)] bg-[var(--panel)] shadow-lg backdrop-blur-md">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.16em] text-[var(--muted)]">
            PLACE
          </div>
          <h2 className="flex items-center gap-2 font-[family-name:var(--font-display)] text-xl leading-tight">
            <span className="truncate">{data.name}</span>
            <StatusDot status={data.status} />
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-sm px-2 py-1 text-sm text-[var(--muted)] hover:bg-white/60"
        >
          关闭
        </button>
      </div>

      <div className="overflow-y-auto px-4 py-3">
        <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-sm bg-[var(--accent-soft)]">
          <Image
            src={data.image}
            alt={data.name}
            fill
            className="object-cover"
            sizes="360px"
          />
        </div>

        <div className="mb-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
          <span className="inline-flex items-center gap-1 rounded-sm bg-white/60 px-2 py-1">
            <CategoryIcon category={data.category} size={12} />
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

        <p className="mb-4 text-sm leading-6 text-[var(--ink)]/90">
          {data.description}
        </p>

        <div className="mb-4">
          <div className="mb-2 text-[10px] tracking-[0.14em] text-[var(--muted)]">
            状态
          </div>
          {data.status === "visited" ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm bg-[var(--visited)]/12 px-3 py-1.5 text-sm text-[var(--visited)]">
                已去过
              </span>
              <button
                type="button"
                disabled={pending !== null}
                onClick={recordVisit}
                className="rounded-sm border border-[var(--line)] bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {pending === "visit"
                  ? "记录中…"
                  : confirmVisit
                    ? "确认记录"
                    : "记录再次访问"}
              </button>
              {confirmVisit && (
                <button
                  type="button"
                  className="text-xs text-[var(--muted)]"
                  onClick={() => setConfirmVisit(false)}
                >
                  取消
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending !== null || data.status === "want_to_go"}
                onClick={() => updateStatus("want_to_go")}
                className="rounded-sm border border-[var(--line)] bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {data.status === "want_to_go" ? "已列入想去" : "想去"}
              </button>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => updateStatus("visited")}
                className="rounded-sm bg-[var(--accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                去过
              </button>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="mb-2 text-[10px] tracking-[0.14em] text-[var(--muted)]">
            评分
          </div>
          <RatingPicker
            value={data.rating}
            disabled={pending !== null}
            onChange={(rating) => patch({ rating }, "rating")}
          />
        </div>

        <div className="mb-4">
          <div className="mb-2 text-[10px] tracking-[0.14em] text-[var(--muted)]">
            感想
          </div>
          <NoteEditor
            value={note}
            pending={pending === "note"}
            onChange={setNote}
            onSave={() => patch({ note }, "note")}
          />
        </div>

        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}

        <Link
          href={`/places/${data.id}`}
          className="inline-flex text-sm text-[var(--accent)] underline-offset-2 hover:underline"
        >
          更多详情 →
        </Link>
      </div>
    </section>
  );
}
