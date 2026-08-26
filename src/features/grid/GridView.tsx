"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CategoryIcon } from "@/components/CategoryIcon";
import { StatusDot } from "@/components/StatusDot";
import { categoryLabel } from "@/lib/categories";
import type { GridLayerGroup, GridPlaceItem } from "@/types/user";

interface GridViewProps {
  groups: GridLayerGroup[];
  regionId?: string | null;
}

const REGION_OPTIONS = [
  { id: "", label: "全部地区" },
  { id: "japan", label: "日本" },
  { id: "pref-13", label: "东京都" },
  { id: "pref-26", label: "京都府" },
  { id: "pref-27", label: "大阪府" },
  { id: "pref-01", label: "北海道" },
  { id: "pref-34", label: "广岛县" },
  { id: "pref-40", label: "福冈县" },
];

function cardTone(status: GridPlaceItem["status"]) {
  if (status === "visited") return "eg-grid-card is-visited";
  if (status === "want_to_go") return "eg-grid-card is-want";
  return "eg-grid-card is-unvisited";
}

function GridCard({ place }: { place: GridPlaceItem }) {
  return (
    <Link href={`/places/${place.id}`} className={cardTone(place.status)}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--accent-soft)]">
        <Image
          src={place.image}
          alt=""
          fill
          className="eg-grid-card__image object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
        />
        <div className="eg-grid-card__veil" />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-sm bg-[var(--panel)] px-1.5 py-0.5 text-[10px] text-[var(--ink)]">
          <CategoryIcon category={place.category} size={11} />
          {categoryLabel(place.category)}
        </span>
        <span className="absolute right-2 top-2">
          <StatusDot status={place.status} />
        </span>
      </div>
      <div className="px-2.5 py-2">
        <div className="truncate text-sm">{place.name}</div>
      </div>
    </Link>
  );
}

export function GridView({ groups, regionId }: GridViewProps) {
  const router = useRouter();

  return (
    <div className="mx-auto min-h-[100dvh] max-w-5xl px-4 pb-16 pt-24 sm:px-6">
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
          城市图鉴
        </h1>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
          地图负责「我要去哪里」，格子负责「我经历过什么」。
        </p>
        <label className="mt-4 block text-sm text-[var(--muted)]">
          地区
          <select
            name="regionId"
            defaultValue={regionId ?? ""}
            className="ml-2 rounded-sm border border-[var(--line)] bg-white px-2 py-1"
            onChange={(event) => {
              const value = event.target.value;
              router.push(value ? `/grid?regionId=${value}` : "/grid");
            }}
          >
            {REGION_OPTIONS.map((option) => (
              <option key={option.id || "all"} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="space-y-12">
        {groups.map((group) => {
          const visited = group.places.filter((p) => p.status === "visited").length;
          if (group.places.length === 0) return null;
          return (
            <section key={group.layerId}>
              <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-2">
                <h2 className="font-[family-name:var(--font-display)] text-xl">
                  {group.layerName}
                </h2>
                <span className="text-sm text-[var(--muted)]">
                  {visited} / {group.places.length}
                </span>
              </div>

              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {group.places.map((place) => (
                  <li key={`${group.layerId}-${place.id}`}>
                    <GridCard place={place} />
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
