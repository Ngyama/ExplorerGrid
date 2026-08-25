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
  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 w-[min(92vw,560px)] -translate-x-1/2">
      <div className="rounded-sm bg-[var(--panel)] p-2 shadow-lg backdrop-blur-sm">
        <div className="mb-2 px-2 text-xs tracking-wide text-[var(--muted)]">
          EXPLORE LAYER
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {layers.map((layer) => {
            const active = layer.id === activeLayerId;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => onChange(layer.id)}
                className={`min-w-[140px] flex-1 rounded-sm px-3 py-3 text-left transition ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "bg-white/50 hover:bg-white/80"
                }`}
              >
                <div className="text-sm font-medium">{layer.name}</div>
                <div
                  className={`mt-1 line-clamp-2 text-xs ${
                    active ? "text-white/80" : "text-[var(--muted)]"
                  }`}
                >
                  {layer.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
