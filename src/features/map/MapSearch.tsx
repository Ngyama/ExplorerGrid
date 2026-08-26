"use client";

import { useEffect, useState } from "react";
import type { PlaceSearchHit } from "@/lib/providers/places/types";
import { categoryLabel } from "@/lib/categories";

interface MapSearchProps {
  onSelectPlace: (placeId: string) => void;
  onFlyTo: (lng: number, lat: number) => void;
  onImported: (placeId: string) => void;
  layerId?: string | null;
}

export function MapSearch({
  onSelectPlace,
  onFlyTo,
  onImported,
  layerId,
}: MapSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchHit[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setPending(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as { results: PlaceSearchHit[] };
        setResults(data.results ?? []);
      } catch {
        setError("搜索失败");
      } finally {
        setPending(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query, open]);

  async function importExternal(hit: PlaceSearchHit) {
    if (!hit.external) return;
    setPending(true);
    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import-external",
          external: hit.external,
          layerId,
        }),
      });
      const data = (await res.json()) as {
        place?: { id: string; longitude: number; latitude: number };
        error?: string;
      };
      if (!res.ok || !data.place) throw new Error(data.error ?? "导入失败");
      onImported(data.place.id);
      onFlyTo(data.place.longitude, data.place.latitude);
      onSelectPlace(data.place.id);
      setOpen(false);
      setQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="pointer-events-auto relative w-[min(92vw,280px)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-sm border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-left text-sm shadow-sm backdrop-blur-md"
      >
        {open ? "关闭搜索" : "搜索地点…"}
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded-sm border border-[var(--line)] bg-[var(--panel)] p-2 shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="六本木新城 / 东京国立博物馆"
            className="mb-2 w-full rounded-sm border border-[var(--line)] bg-white px-2 py-1.5 text-sm"
          />
          {pending && (
            <div className="px-1 text-xs text-[var(--muted)]">搜索中…</div>
          )}
          {error && <div className="px-1 text-xs text-red-700">{error}</div>}
          <ul className="max-h-64 overflow-y-auto">
            {results.map((hit, index) => (
              <li
                key={`${hit.kind}-${hit.placeId ?? hit.external?.externalId ?? index}`}
                className="border-t border-[var(--line)]/60 first:border-0"
              >
                <button
                  type="button"
                  className="flex w-full flex-col gap-0.5 px-2 py-2 text-left hover:bg-white/70"
                  onClick={() => {
                    if (hit.kind === "place" && hit.placeId) {
                      onFlyTo(hit.longitude, hit.latitude);
                      onSelectPlace(hit.placeId);
                      setOpen(false);
                      setQuery("");
                    } else {
                      void importExternal(hit);
                    }
                  }}
                >
                  <span className="text-sm font-medium">{hit.name}</span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {categoryLabel(hit.category)} ·{" "}
                    {hit.kind === "place" ? "已在图中" : "加入 ExplorerGrid"}
                  </span>
                </button>
              </li>
            ))}
            {!pending && query.length >= 2 && results.length === 0 && (
              <li className="px-2 py-2 text-xs text-[var(--muted)]">无结果</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
