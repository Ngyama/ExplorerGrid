"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ContentSwitcher } from "@/features/explore/ContentSwitcher";
import { CustomPlaceDialog } from "@/features/map/CustomPlaceDialog";
import { ExploreViewPanel } from "@/features/map/ExploreViewPanel";
import { MapSearch } from "@/features/map/MapSearch";
import { MapView, type MapCameraState } from "@/features/map/MapView";
import { PlaceQuickPanel } from "@/features/map/PlaceQuickPanel";
import { RegionBreadcrumb } from "@/features/map/RegionBreadcrumb";
import { RegionSummaryPanel } from "@/features/map/RegionSummaryPanel";
import {
  findRegionAtPoint,
  JAPAN_CENTER,
  JAPAN_DEFAULT_ZOOM,
  JAPAN_REGION,
  type RegionFeature,
  type RegionFeatureCollection,
} from "@/lib/geo/regions";
import type {
  CollectionSummary,
  ExploreLayer,
  MapPlaceMarker,
} from "@/types/explore";
import type { PlaceWithStatus } from "@/types/place";
import type {
  CategoryExploreStat,
  Region,
  RegionPathItem,
} from "@/types/region";
import type { PlaceRecord } from "@/types/user";

function regionQuery(region: Region) {
  const params = new URLSearchParams();
  params.set("regionId", region.id);
  params.set("regionType", region.type);
  params.set("regionLabel", region.label);
  if (region.parentId) params.set("parentId", region.parentId);
  return params;
}

export function MapExplorer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialCamera = useMemo<Partial<MapCameraState>>(() => {
    const latRaw = searchParams.get("lat");
    const lngRaw = searchParams.get("lng");
    const zoomRaw = searchParams.get("zoom");
    const lat = latRaw != null ? Number(latRaw) : NaN;
    const lng = lngRaw != null ? Number(lngRaw) : NaN;
    const zoom = zoomRaw != null ? Number(zoomRaw) : NaN;
    return {
      lat: Number.isFinite(lat) ? lat : JAPAN_CENTER[1],
      lng: Number.isFinite(lng) ? lng : JAPAN_CENTER[0],
      zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : JAPAN_DEFAULT_ZOOM,
    };
  }, [searchParams]);

  const [mode, setMode] = useState<"explore" | "collection">("explore");
  const [layers, setLayers] = useState<ExploreLayer[]>([]);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [activeLayerId, setActiveLayerId] = useState(
    () => searchParams.get("view") || "classic-japan"
  );
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null
  );
  const [places, setPlaces] = useState<MapPlaceMarker[]>([]);
  const [camera, setCamera] = useState<MapCameraState>({
    lat: initialCamera.lat ?? JAPAN_CENTER[1],
    lng: initialCamera.lng ?? JAPAN_CENTER[0],
    zoom: initialCamera.zoom ?? JAPAN_DEFAULT_ZOOM,
  });
  const [region, setRegion] = useState<Region>(JAPAN_REGION);
  const [path, setPath] = useState<RegionPathItem[]>([
    {
      id: JAPAN_REGION.id,
      label: JAPAN_REGION.label,
      type: "country",
      bbox: JAPAN_REGION.bbox,
    },
  ]);
  const [categories, setCategories] = useState<CategoryExploreStat[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithStatus | null>(
    null
  );
  const [showExploreDetail, setShowExploreDetail] = useState(false);
  const [customDraft, setCustomDraft] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryCollapsed, setSummaryCollapsed] = useState(true);
  const [flyToBounds, setFlyToBounds] = useState<
    [number, number, number, number] | null
  >(null);
  const [flyKey, setFlyKey] = useState(0);
  const [flyTo, setFlyTo] = useState<{
    lng: number;
    lat: number;
    zoom?: number;
  } | null>(null);
  const [flyToKey, setFlyToKey] = useState(0);
  const [placesVersion, setPlacesVersion] = useState(0);

  const prefecturesRef = useRef<RegionFeature[]>([]);
  const wardsRef = useRef<RegionFeature[]>([]);
  const geoReadyRef = useRef(false);
  const urlTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [stableRegion, setStableRegion] = useState<Region>(JAPAN_REGION);
  const regionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (regionDebounceRef.current) clearTimeout(regionDebounceRef.current);
    regionDebounceRef.current = setTimeout(() => {
      setStableRegion(region);
    }, 280);
    return () => {
      if (regionDebounceRef.current) clearTimeout(regionDebounceRef.current);
    };
  }, [region]);

  useEffect(() => {
    let cancelled = false;
    async function loadGeo() {
      try {
        const [prefsRes, wardsRes] = await Promise.all([
          fetch("/geo/prefectures.json"),
          fetch("/geo/tokyo-wards.json"),
        ]);
        if (!prefsRes.ok || !wardsRes.ok) {
          throw new Error("无法加载行政区边界");
        }
        const prefs = (await prefsRes.json()) as RegionFeatureCollection;
        const wards = (await wardsRes.json()) as RegionFeatureCollection;
        if (cancelled) return;
        prefecturesRef.current = prefs.features;
        wardsRef.current = wards.features;
        geoReadyRef.current = true;
        const resolved = findRegionAtPoint(
          camera.lng,
          camera.lat,
          camera.zoom,
          prefecturesRef.current,
          wardsRef.current
        );
        setRegion(resolved.region);
        setPath(resolved.path);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "行政区加载失败");
        }
      }
    }
    loadGeo();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 640px)");
    const sync = () => setSummaryCollapsed(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const refreshCollections = useCallback(async () => {
    const res = await fetch("/api/collections");
    if (!res.ok) return;
    const data = (await res.json()) as CollectionSummary[];
    setCollections(data);
    setActiveCollectionId((current) => current ?? data[0]?.id ?? null);
  }, []);

  useEffect(() => {
    void refreshCollections();
  }, [refreshCollections]);

  const handleCameraChange = useCallback((next: MapCameraState) => {
    setCamera(next);
    if (!geoReadyRef.current) return;
    const resolved = findRegionAtPoint(
      next.lng,
      next.lat,
      next.zoom,
      prefecturesRef.current,
      wardsRef.current
    );
    setRegion(resolved.region);
    setPath(resolved.path);
  }, []);

  useEffect(() => {
    if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    urlTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      params.set("lat", camera.lat.toFixed(5));
      params.set("lng", camera.lng.toFixed(5));
      params.set("zoom", camera.zoom.toFixed(2));
      if (mode === "explore") params.set("view", activeLayerId);
      else if (activeCollectionId) params.set("collection", activeCollectionId);
      const next = `${pathname}?${params.toString()}`;
      if (typeof window !== "undefined") {
        window.history.replaceState(window.history.state, "", next);
      }
    }, 350);
    return () => {
      if (urlTimerRef.current) clearTimeout(urlTimerRef.current);
    };
  }, [camera, activeLayerId, activeCollectionId, mode, pathname]);

  useEffect(() => {
    let cancelled = false;
    async function loadLayers() {
      try {
        const res = await fetch(`/api/layers?${regionQuery(stableRegion)}`);
        if (!res.ok) throw new Error("无法加载探索主题");
        const data = (await res.json()) as ExploreLayer[];
        if (cancelled) return;
        setLayers(data);
        if (data.length > 0 && !data.some((layer) => layer.id === activeLayerId)) {
          setActiveLayerId(data[0].id);
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
  }, [stableRegion, activeLayerId, placesVersion]);

  useEffect(() => {
    let cancelled = false;
    async function loadPlaces() {
      setLoading(true);
      setError(null);
      try {
        // Fetch full view payload once; MapLibre layer filters handle zoom/importance.
        const params = regionQuery(stableRegion);
        params.set("zoom", "20");

        let res: Response;
        if (mode === "collection") {
          if (!activeCollectionId) {
            if (!cancelled) setPlaces([]);
            return;
          }
          res = await fetch(
            `/api/collections/${activeCollectionId}/places?${params}`
          );
        } else {
          if (!activeLayerId) return;
          res = await fetch(`/api/layers/${activeLayerId}/places?${params}`);
        }
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
  }, [
    mode,
    activeLayerId,
    activeCollectionId,
    stableRegion,
    placesVersion,
  ]);

  useEffect(() => {
    let cancelled = false;
    async function loadSummary() {
      try {
        const params = regionQuery(stableRegion);
        if (mode === "collection" && activeCollectionId) {
          params.set("collectionId", activeCollectionId);
        } else if (activeLayerId) {
          params.set("layerId", activeLayerId);
        } else {
          return;
        }
        const res = await fetch(`/api/region-summary?${params}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          categories: CategoryExploreStat[];
        };
        if (!cancelled) setCategories(data.categories);
      } catch {
        // non-critical
      }
    }
    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [mode, activeLayerId, activeCollectionId, stableRegion, places]);

  const handlePlaceClick = useCallback(
    async (placeId: string) => {
      try {
        const params = new URLSearchParams();
        if (mode === "explore" && activeLayerId) {
          params.set("layerId", activeLayerId);
        }
        const res = await fetch(
          `/api/places/${placeId}${params.size ? `?${params}` : ""}`
        );
        if (!res.ok) throw new Error("无法加载地点");
        const data = (await res.json()) as PlaceWithStatus;
        setSelectedPlace(data);
        setShowExploreDetail(false);
        setSummaryCollapsed(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      }
    },
    [mode, activeLayerId]
  );

  const handleRecordChange = useCallback(
    (placeId: string, record: PlaceRecord) => {
      setPlaces((current) =>
        current.map((place) =>
          place.id === placeId ? { ...place, status: record.status } : place
        )
      );
      setSelectedPlace((current) =>
        current && current.id === placeId
          ? { ...current, ...record }
          : current
      );
    },
    []
  );

  const handleBreadcrumb = useCallback((item: RegionPathItem) => {
    if (item.bbox) {
      setFlyToBounds(item.bbox);
      setFlyKey((value) => value + 1);
    }
  }, []);

  const activeLayer = layers.find((layer) => layer.id === activeLayerId);
  const placeCount = categories.reduce((sum, item) => sum + item.total, 0);
  const visitedCount = categories.reduce((sum, item) => sum + item.visited, 0);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <MapView
        places={places}
        highlightedCategory={activeCategory}
        selectedPlaceId={selectedPlace?.id ?? null}
        initialCamera={initialCamera}
        onPlaceClick={handlePlaceClick}
        onCameraChange={handleCameraChange}
        flyToBounds={flyToBounds}
        flyKey={flyKey}
        flyTo={flyTo}
        flyToKey={flyToKey}
        onContextAddPlace={(lng, lat) => setCustomDraft({ lng, lat })}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-start justify-between gap-2 px-4 pt-[4.75rem] sm:px-6">
        <div className="pointer-events-auto inline-flex max-w-[min(92vw,420px)] rounded-sm border border-[var(--line)] bg-[var(--panel)] px-3 py-2 shadow-sm backdrop-blur-md">
          <RegionBreadcrumb path={path} onSelect={handleBreadcrumb} />
        </div>
        <MapSearch
          layerId={activeLayerId}
          onSelectPlace={handlePlaceClick}
          onFlyTo={(lng, lat) => {
            setFlyTo({ lng, lat, zoom: 14 });
            setFlyToKey((v) => v + 1);
          }}
          onImported={() => setPlacesVersion((v) => v + 1)}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-[7.5rem] z-20 px-3 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-24 sm:w-[min(92vw,320px)] sm:px-0 lg:right-6">
        <div className="pointer-events-auto">
          {selectedPlace ? (
            <PlaceQuickPanel
              place={selectedPlace}
              collections={collections}
              onClose={() => {
                setSelectedPlace(null);
                if (
                  typeof window !== "undefined" &&
                  window.matchMedia("(min-width: 640px)").matches
                ) {
                  setSummaryCollapsed(false);
                }
              }}
              onRecordChange={handleRecordChange}
              onCollectionsChange={() => {
                void refreshCollections();
              }}
            />
          ) : showExploreDetail && activeLayer ? (
            <ExploreViewPanel
              layer={activeLayer}
              onClose={() => setShowExploreDetail(false)}
            />
          ) : (
            <RegionSummaryPanel
              regionLabel={region.label}
              layerName={
                mode === "explore"
                  ? activeLayer?.name ?? null
                  : collections.find((c) => c.id === activeCollectionId)?.name ??
                    null
              }
              categories={categories}
              placeCount={placeCount}
              visitedCount={visitedCount}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              collapsed={summaryCollapsed}
              onToggleCollapsed={() => setSummaryCollapsed((v) => !v)}
            />
          )}
        </div>
      </div>

      <ContentSwitcher
        mode={mode}
        onModeChange={(next) => {
          setMode(next);
          setActiveCategory(null);
          setSelectedPlace(null);
          setShowExploreDetail(false);
        }}
        layers={layers}
        activeLayerId={activeLayerId}
        onLayerChange={(id) => {
          setActiveLayerId(id);
          setActiveCategory(null);
          setSelectedPlace(null);
          setShowExploreDetail(false);
        }}
        collections={collections}
        activeCollectionId={activeCollectionId}
        onCollectionChange={(id) => {
          setActiveCollectionId(id);
          setActiveCategory(null);
          setSelectedPlace(null);
        }}
        onCreateCollection={async () => {
          const name = window.prompt("Collection 名称", "东京下次去");
          if (!name?.trim()) return;
          const res = await fetch("/api/collections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name.trim() }),
          });
          if (!res.ok) return;
          const created = (await res.json()) as CollectionSummary;
          await refreshCollections();
          setMode("collection");
          setActiveCollectionId(created.id);
        }}
        onShowExploreDetail={() => {
          setSelectedPlace(null);
          setShowExploreDetail(true);
        }}
      />

      {customDraft && (
        <CustomPlaceDialog
          lng={customDraft.lng}
          lat={customDraft.lat}
          layerId={mode === "explore" ? activeLayerId : null}
          onClose={() => setCustomDraft(null)}
          onCreated={(placeId) => {
            setCustomDraft(null);
            setPlacesVersion((v) => v + 1);
            void handlePlaceClick(placeId);
          }}
        />
      )}

      {(loading || error) && (
        <div className="pointer-events-none absolute left-4 top-[7.5rem] z-20 rounded-sm bg-[var(--panel)] px-3 py-2 text-sm backdrop-blur-sm">
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
