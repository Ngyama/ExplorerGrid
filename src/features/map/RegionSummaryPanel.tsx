"use client";

import type { CategoryExploreStat } from "@/types/region";

interface RegionSummaryPanelProps {
  regionLabel: string;
  layerName: string | null;
  categories: CategoryExploreStat[];
  placeCount: number;
  visitedCount: number;
  wardProgress?: {
    visited: number;
    total: number;
    ratio: number;
    conquered: boolean;
  } | null;
  activeCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function RegionSummaryPanel({
  regionLabel,
  layerName,
  categories,
  placeCount,
  visitedCount,
  wardProgress,
  activeCategory,
  onSelectCategory,
  collapsed,
  onToggleCollapsed,
}: RegionSummaryPanelProps) {
  return (
    <section className="eg-side-panel rounded-sm border border-[var(--line)] bg-[var(--panel)] shadow-lg backdrop-blur-md">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.16em] text-[var(--muted)]">
            REGION
          </div>
          <h2 className="truncate font-[family-name:var(--font-display)] text-xl leading-tight">
            {regionLabel}
          </h2>
          {layerName && (
            <p className="mt-1 text-xs text-[var(--muted)]">{layerName}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs text-[var(--muted)]">
            {placeCount} 个地点 · 已探索 {visitedCount}
          </div>
          {wardProgress && wardProgress.total > 0 && (
            <div
              className={`mt-0.5 text-xs tabular-nums ${
                wardProgress.conquered
                  ? "font-medium text-[var(--visited)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {wardProgress.conquered
                ? "制霸"
                : `制霸进度 ${Math.round(wardProgress.ratio * 100)}%`}
              {" · "}
              {wardProgress.visited}/{wardProgress.total}
            </div>
          )}
          {onToggleCollapsed && (
            <button
              type="button"
              className="mt-1 text-xs text-[var(--muted)] underline sm:hidden"
              onClick={onToggleCollapsed}
            >
              {collapsed ? "展开" : "收起"}
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <ul className="max-h-[42vh] space-y-1 overflow-y-auto px-2 py-2 sm:max-h-none">
          {categories.length === 0 ? (
            <li className="px-2 py-3 text-sm text-[var(--muted)]">
              当前区域在此观察方式下还没有收录地点。
            </li>
          ) : (
            categories.map((item) => {
              const active = activeCategory === item.category;
              return (
                <li key={item.category}>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectCategory(active ? null : item.category)
                    }
                    className={`flex w-full items-center justify-between gap-3 rounded-sm px-2 py-2 text-left text-sm transition ${
                      active
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "hover:bg-white/55"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="tabular-nums text-[var(--muted)]">
                      {item.visited} / {item.total}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </section>
  );
}
