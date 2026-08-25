"use client";

import type { RegionPathItem } from "@/types/region";

interface RegionBreadcrumbProps {
  path: RegionPathItem[];
  onSelect: (item: RegionPathItem) => void;
}

export function RegionBreadcrumb({ path, onSelect }: RegionBreadcrumbProps) {
  return (
    <nav
      aria-label="当前地区"
      className="flex flex-wrap items-center gap-1 text-xs text-[var(--muted)] sm:text-sm"
    >
      {path.map((item, index) => (
        <span key={item.id} className="inline-flex items-center gap-1">
          {index > 0 && <span className="opacity-40">/</span>}
          <button
            type="button"
            onClick={() => onSelect(item)}
            className={`rounded-sm px-1 py-0.5 transition hover:bg-white/60 hover:text-[var(--ink)] ${
              index === path.length - 1 ? "text-[var(--ink)]" : ""
            }`}
          >
            {item.label}
          </button>
        </span>
      ))}
    </nav>
  );
}
