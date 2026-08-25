"use client";

import type { ExploreLayer } from "@/types/explore";

interface LayerSwitcherProps {
  layers: ExploreLayer[];
  activeLayerId: string;
  onChange: (layerId: string) => void;
}

export function LayerSwitcher({
  layers,
  activeLayerId,
  onChange,
}: LayerSwitcherProps) {
  const active = layers.find((layer) => layer.id === activeLayerId) ?? layers[0];

  if (!active) return null;

  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 w-[min(94vw,560px)] -translate-x-1/2 pb-[env(safe-area-inset-bottom)] sm:bottom-5">
      <div className="rounded-sm border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5 shadow-lg backdrop-blur-md sm:px-4 sm:py-3">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] tracking-[0.18em] text-[var(--muted)]">
              EXPLORE LAYER
            </div>
            <div className="truncate font-[family-name:var(--font-display)] text-lg leading-tight">
              {active.name}
            </div>
          </div>
          <div className="shrink-0 text-right text-xs text-[var(--muted)]">
            {active.placeCount} 个地点 · 已探索 {active.visitedCount}
          </div>
        </div>

        <p className="mb-3 hidden text-xs leading-5 text-[var(--muted)] sm:block">
          {active.description}
        </p>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {layers.map((layer) => {
            const selected = layer.id === activeLayerId;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onChange(layer.id)}
                className={`min-w-[132px] flex-1 rounded-sm px-3 py-2.5 text-left transition ${
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
                  {layer.placeCount} 个地点 · 已探索 {layer.visitedCount}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
