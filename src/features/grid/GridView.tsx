"use client";

import Link from "next/link";
import type { GridLayerGroup } from "@/types/user";
import { StatusDot } from "@/components/StatusDot";

interface GridViewProps {
  groups: GridLayerGroup[];
}

export function GridView({ groups }: GridViewProps) {
  return (
    <div className="mx-auto min-h-[100dvh] max-w-4xl px-4 pb-16 pt-24 sm:px-6">
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
          城市图鉴
        </h1>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
          地图负责「我要去哪里」，格子负责「我经历过什么」。○ 未访问 · ◐ 想去 · ●
          已访问
        </p>
      </header>

      <div className="space-y-10">
        {groups.map((group) => {
          const visited = group.places.filter((p) => p.status === "visited").length;
          return (
            <section key={group.layerId}>
              <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-2">
                <h2 className="font-[family-name:var(--font-display)] text-xl">
                  {group.layerName}
                </h2>
                <span className="text-sm text-[var(--muted)]">
                  {visited}/{group.places.length}
                </span>
              </div>

              <ul className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                {group.places.map((place) => (
                  <li key={`${group.layerId}-${place.id}`}>
                    <Link
                      href={`/places/${place.id}`}
                      className="flex items-center justify-between gap-3 py-2 transition hover:bg-white/40"
                    >
                      <span>{place.name}</span>
                      <StatusDot status={place.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
