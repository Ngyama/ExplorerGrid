"use client";

import type { ExploreLayer } from "@/types/explore";

interface ExploreViewPanelProps {
  layer: ExploreLayer;
  onClose: () => void;
}

export function ExploreViewPanel({ layer, onClose }: ExploreViewPanelProps) {
  return (
    <section className="eg-side-panel rounded-sm border border-[var(--line)] bg-[var(--panel)] p-4 shadow-lg backdrop-blur-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] tracking-[0.16em] text-[var(--muted)]">
            EXPLORE VIEW
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl leading-tight">
            {layer.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-[var(--muted)]"
        >
          关闭
        </button>
      </div>
      <p className="mb-3 text-sm leading-6 text-[var(--ink)]/90">
        {layer.description}
      </p>
      <div className="text-xs text-[var(--muted)]">
        {layer.placeCount} places · 已探索 {layer.visitedCount}
        {layer.regionId ? ` · 区域 ${layer.regionId}` : " · 跨区域"}
      </div>
    </section>
  );
}
