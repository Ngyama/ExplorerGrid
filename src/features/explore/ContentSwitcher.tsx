"use client";

import type { CollectionSummary, ExploreLayer } from "@/types/explore";

interface ContentSwitcherProps {
  mode: "explore" | "collection";
  onModeChange: (mode: "explore" | "collection") => void;
  layers: ExploreLayer[];
  activeLayerId: string;
  onLayerChange: (layerId: string) => void;
  collections: CollectionSummary[];
  activeCollectionId: string | null;
  onCollectionChange: (collectionId: string) => void;
  onCreateCollection: () => void;
  onShowExploreDetail: () => void;
}

export function ContentSwitcher({
  mode,
  onModeChange,
  layers,
  activeLayerId,
  onLayerChange,
  collections,
  activeCollectionId,
  onCollectionChange,
  onCreateCollection,
  onShowExploreDetail,
}: ContentSwitcherProps) {
  const activeLayer =
    layers.find((layer) => layer.id === activeLayerId) ?? layers[0];
  const activeCollection =
    collections.find((c) => c.id === activeCollectionId) ?? collections[0];

  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 w-[min(94vw,600px)] -translate-x-1/2 pb-[env(safe-area-inset-bottom)] sm:bottom-5">
      <div className="rounded-sm border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5 shadow-lg backdrop-blur-md sm:px-4 sm:py-3">
        <div className="mb-2 flex items-center gap-2 text-[10px] tracking-[0.16em] text-[var(--muted)]">
          <button
            type="button"
            onClick={() => onModeChange("explore")}
            className={
              mode === "explore" ? "text-[var(--accent)]" : "hover:text-[var(--ink)]"
            }
          >
            EXPLORE VIEW
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onModeChange("collection")}
            className={
              mode === "collection"
                ? "text-[var(--accent)]"
                : "hover:text-[var(--ink)]"
            }
          >
            MY COLLECTIONS
          </button>
        </div>

        {mode === "explore" && activeLayer ? (
          <>
            <div className="mb-2 flex items-end justify-between gap-3">
              <button
                type="button"
                onClick={onShowExploreDetail}
                className="min-w-0 text-left"
              >
                <div className="truncate font-[family-name:var(--font-display)] text-lg leading-tight">
                  {activeLayer.name}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {activeLayer.placeCount} 个地点 · 已探索 {activeLayer.visitedCount}
                </div>
              </button>
              <button
                type="button"
                onClick={onShowExploreDetail}
                className="shrink-0 text-xs text-[var(--accent)]"
              >
                主题说明
              </button>
            </div>
            <p className="mb-3 hidden text-xs leading-5 text-[var(--muted)] sm:block">
              {activeLayer.description}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {layers.map((layer) => {
                const selected = layer.id === activeLayerId;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => onLayerChange(layer.id)}
                    className={`min-w-[124px] flex-1 rounded-sm px-3 py-2.5 text-left transition ${
                      selected
                        ? "bg-[var(--accent)] text-white"
                        : "bg-white/55 hover:bg-white/85"
                    }`}
                  >
                    <div className="text-sm font-medium">{layer.name}</div>
                    <div
                      className={`mt-1 text-[11px] ${
                        selected ? "text-white/80" : "text-[var(--muted)]"
                      }`}
                    >
                      {layer.placeCount} 地点
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="mb-2 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-[family-name:var(--font-display)] text-lg leading-tight">
                  {activeCollection?.name ?? "我的 Collection"}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {activeCollection
                    ? `${activeCollection.placeCount} 个地点`
                    : "创建集合来组织下次旅程"}
                </div>
              </div>
              <button
                type="button"
                onClick={onCreateCollection}
                className="shrink-0 rounded-sm border border-[var(--line)] bg-white px-2 py-1 text-xs"
              >
                新建
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {collections.length === 0 ? (
                <button
                  type="button"
                  onClick={onCreateCollection}
                  className="rounded-sm border border-dashed border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)]"
                >
                  创建第一个 Collection
                </button>
              ) : (
                collections.map((collection) => {
                  const selected = collection.id === activeCollectionId;
                  return (
                    <button
                      key={collection.id}
                      type="button"
                      onClick={() => onCollectionChange(collection.id)}
                      className={`min-w-[124px] flex-1 rounded-sm px-3 py-2.5 text-left transition ${
                        selected
                          ? "bg-[#3d4f45] text-white"
                          : "bg-white/55 hover:bg-white/85"
                      }`}
                    >
                      <div className="text-sm font-medium">{collection.name}</div>
                      <div
                        className={`mt-1 text-[11px] ${
                          selected ? "text-white/80" : "text-[var(--muted)]"
                        }`}
                      >
                        {collection.placeCount} 地点
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
