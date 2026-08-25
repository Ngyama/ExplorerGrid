"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapView } from "@/features/map/MapView";
import { LayerSwitcher } from "@/features/explore/LayerSwitcher";
import type { ExploreLayer, MapPlaceMarker } from "@/types/explore";

export function MapExplorer() {
  const router = useRouter();
  const [layers, setLayers] = useState<ExploreLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState("classic-tokyo");
  const [places, setPlaces] = useState<MapPlaceMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLayers() {
      try {
        const res = await fetch("/api/layers");
        if (!res.ok) throw new Error("无法加载探索主题");
        const data = (await res.json()) as ExploreLayer[];
        if (cancelled) return;
        setLayers(data);
        if (data.length > 0) {
          setActiveLayerId((current) =>
            data.some((layer) => layer.id === current)
              ? current
              : data[0].id
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载失败");
        }
      }
    }

    loadLayers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      if (!activeLayerId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/layers/${activeLayerId}/places`);
        if (!res.ok) throw new Error("无法加载地点");
        const data = (await res.json()) as MapPlaceMarker[];
        if (!cancelled) setPlaces(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载失败");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlaces();
    return () => {
      cancelled = true;
    };
  }, [activeLayerId]);

  const handlePlaceClick = useCallback(
    (placeId: string) => {
      router.push(`/places/${placeId}`);
    },
    [router]
  );

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <MapView places={places} onPlaceClick={handlePlaceClick} />

      <LayerSwitcher
        layers={layers}
        activeLayerId={activeLayerId}
        onChange={setActiveLayerId}
      />

      {(loading || error) && (
        <div className="pointer-events-none absolute left-4 top-24 z-20 rounded-sm bg-[var(--panel)] px-3 py-2 text-sm backdrop-blur-sm">
          {error ? (
            <span className="text-red-700">{error}</span>
          ) : (
            <span className="text-[var(--muted)]">加载地点中…</span>
          )}
        </div>
      )}
    </div>
  );
}
