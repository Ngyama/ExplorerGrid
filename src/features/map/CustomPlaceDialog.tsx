"use client";

import { useState } from "react";
import { CATEGORY_LABEL } from "@/lib/categories";
import type { PlaceCategory } from "@/types/place";

interface CustomPlaceDialogProps {
  lng: number;
  lat: number;
  layerId?: string | null;
  onClose: () => void;
  onCreated: (placeId: string) => void;
}

export function CustomPlaceDialog({
  lng,
  lat,
  layerId,
  onClose,
  onCreated,
}: CustomPlaceDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("landmark");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "custom",
          name,
          category,
          description,
          latitude: lat,
          longitude: lng,
          layerId,
        }),
      });
      const data = (await res.json()) as {
        place?: { id: string };
        error?: string;
      };
      if (!res.ok || !data.place) throw new Error(data.error ?? "创建失败");
      onCreated(data.place.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-sm border border-[var(--line)] bg-[var(--panel)] p-4 shadow-xl"
      >
        <div className="mb-3 text-[10px] tracking-[0.16em] text-[var(--muted)]">
          CUSTOM PLACE
        </div>
        <h3 className="mb-3 font-[family-name:var(--font-display)] text-xl">
          添加地点
        </h3>
        <p className="mb-3 text-xs text-[var(--muted)]">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
        <label className="mb-3 block text-sm">
          名称
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-sm border border-[var(--line)] bg-white px-2 py-1.5"
            placeholder="某动画圣地楼梯"
          />
        </label>
        <label className="mb-3 block text-sm">
          类型
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PlaceCategory)}
            className="mt-1 w-full rounded-sm border border-[var(--line)] bg-white px-2 py-1.5"
          >
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="mb-4 block text-sm">
          简介（可选）
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-sm border border-[var(--line)] bg-white px-2 py-1.5"
          />
        </label>
        {error && <p className="mb-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-3 py-1.5 text-sm text-[var(--muted)]"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-sm bg-[var(--accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {pending ? "保存中…" : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}
