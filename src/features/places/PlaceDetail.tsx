"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PlaceWithStatus } from "@/types/place";
import type { UserPlaceStatus } from "@/types/user";
import { StatusDot } from "@/components/StatusDot";

const CATEGORY_LABEL: Record<string, string> = {
  museum: "博物馆",
  restaurant: "餐厅",
  cafe: "咖啡馆",
  landmark: "地标",
  park: "公园",
  shrine: "神社寺院",
  cinema: "影院",
  street: "街区",
  bookstore: "书店",
  memorial: "纪念馆",
};

interface PlaceDetailProps {
  place: PlaceWithStatus;
}

export function PlaceDetail({ place }: PlaceDetailProps) {
  const router = useRouter();
  const [status, setStatus] = useState<UserPlaceStatus | null>(place.status);
  const [pending, setPending] = useState<UserPlaceStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(next: UserPlaceStatus) {
    setPending(next);
    setError(null);
    try {
      const res = await fetch("/api/user-places", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: place.id, status: next }),
      });
      if (!res.ok) throw new Error("更新失败");
      setStatus(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    } finally {
      setPending(null);
    }
  }

  return (
    <article className="mx-auto min-h-[100dvh] max-w-3xl px-4 pb-16 pt-24 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        ← 返回地图
      </Link>

      <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-sm bg-[var(--accent-soft)]">
        <Image
          src={place.image}
          alt={place.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
      </div>

      <div className="mb-2 flex items-center gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
          {place.name}
        </h1>
        <StatusDot status={status} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
        <span className="rounded-sm bg-white/60 px-2 py-1">
          {CATEGORY_LABEL[place.category] ?? place.category}
        </span>
        {place.layers?.map((layer) => (
          <span
            key={layer.id}
            className="rounded-sm bg-[var(--accent-soft)] px-2 py-1 text-[var(--accent)]"
          >
            {layer.name}
          </span>
        ))}
      </div>

      <p className="mb-8 max-w-2xl leading-7 text-[var(--ink)]/90">
        {place.description}
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending !== null || status === "want_to_go"}
          onClick={() => updateStatus("want_to_go")}
          className="rounded-sm border border-[var(--line)] bg-white px-5 py-3 text-sm transition hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending === "want_to_go" ? "保存中…" : "想去"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => updateStatus("visited")}
          className="rounded-sm bg-[var(--accent)] px-5 py-3 text-sm text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending === "visited"
            ? "保存中…"
            : status === "visited"
              ? "再次记录访问"
              : "去过"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
    </article>
  );
}
