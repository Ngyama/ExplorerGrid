"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORY_LABEL } from "@/lib/categories";

type ReviewPlace = {
  id: string;
  name: string;
  nameJa: string | null;
  nameEn: string | null;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  image: string;
  regionId: string | null;
  importance: number;
  sourceType: string;
  reviewStatus: string;
  possibleDuplicateOf: string | null;
  provider: string | null;
  externalId: string | null;
  layers: Array<{ id: string; name: string; note: string | null }>;
  warnings: string[];
  priorityScore: number;
};

type Stats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  missingRegion: number;
  possibleDuplicate: number;
  byWard: Record<string, number>;
  byCategory: Record<string, number>;
  byImportance: Record<string, number>;
};

type ExploreLayer = {
  id: string;
  name: string;
  description: string;
  regionId: string | null;
  visibility: string;
};

const WARD_LABELS: Record<string, string> = {
  "ward-13101": "千代田",
  "ward-13102": "中央",
  "ward-13103": "港区",
  "ward-13104": "新宿",
  "ward-13105": "文京",
  "ward-13106": "台东",
  "ward-13107": "墨田",
  "ward-13108": "江东",
  "ward-13113": "涩谷",
  "ward-13116": "丰岛",
  "pref-13": "东京都",
  missing: "无 Region",
};

export default function AdminReviewPage() {
  const [tab, setTab] = useState<"places" | "views">("places");
  const [items, setItems] = useState<ReviewPlace[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [layers, setLayers] = useState<ExploreLayer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [reviewStatus, setReviewStatus] = useState("pending");
  const [regionId, setRegionId] = useState("tokyo-core");
  const [category, setCategory] = useState("");
  const [importance, setImportance] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [layerId, setLayerId] = useState("");
  const [q, setQ] = useState("");
  const [batchLayerId, setBatchLayerId] = useState("literary-tokyo");
  const [candidates, setCandidates] = useState<
    Array<{ id: string; name: string; category: string; importance: number }>
  >([]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (reviewStatus) params.set("reviewStatus", reviewStatus);
    if (regionId) params.set("regionId", regionId);
    if (category) params.set("category", category);
    if (importance) params.set("importance", importance);
    if (sourceType) params.set("sourceType", sourceType);
    if (layerId) params.set("layerId", layerId);
    if (q.trim()) params.set("q", q.trim());
    params.set("sort", "priority");
    params.set("limit", "100");
    return params.toString();
  }, [reviewStatus, regionId, category, importance, sourceType, layerId, q]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes, layersRes] = await Promise.all([
        fetch(`/api/admin/review?${query}`),
        fetch("/api/admin/review?stats=1"),
        fetch("/api/admin/views"),
      ]);
      const listData = (await listRes.json()) as {
        items: ReviewPlace[];
        total: number;
      };
      setItems(listData.items);
      setTotal(listData.total);
      setStats((await statsRes.json()) as Stats);
      setLayers((await layersRes.json()) as ExploreLayer[]);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }
      const ids = [...selected];
      if (ids.length === 0 && items[0]) ids.push(items[0].id);
      if (event.key === "a" || event.key === "A") {
        void batch({ placeIds: ids, reviewStatus: "approved" });
      }
      if (event.key === "r" || event.key === "R") {
        void batch({ placeIds: ids, reviewStatus: "rejected" });
      }
      if (event.key === "1" || event.key === "2" || event.key === "3") {
        void batch({
          placeIds: ids,
          importance: Number(event.key),
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function batch(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setMessage("操作失败");
      return;
    }
    setMessage("已保存");
    await reload();
  }

  async function patchOne(placeId: string, body: Record<string, unknown>) {
    await batch({ placeId, ...body });
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  }

  const selectedIds = [...selected];

  return (
    <div className="min-h-[100dvh] bg-[#f3efe6] px-4 pb-16 pt-20 text-[#1c1915] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] tracking-[0.18em] text-[var(--muted)]">
              INTERNAL / ADMIN
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl">
              Tokyo Content Review
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              自动候选 + 人工快速判断。快捷键：A 通过 · R 排除 · 1/2/3 重要度
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              className={`rounded-sm px-3 py-1.5 ${tab === "places" ? "bg-[var(--accent)] text-white" : "bg-white"}`}
              onClick={() => setTab("places")}
            >
              Places
            </button>
            <button
              type="button"
              className={`rounded-sm px-3 py-1.5 ${tab === "views" ? "bg-[var(--accent)] text-white" : "bg-white"}`}
              onClick={() => setTab("views")}
            >
              Explore Views
            </button>
          </div>
        </header>

        {stats && (
          <div className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:grid-cols-7">
            {[
              ["Total", stats.total],
              ["Pending", stats.pending],
              ["Approved", stats.approved],
              ["Rejected", stats.rejected],
              ["No region", stats.missingRegion],
              ["Dupes", stats.possibleDuplicate],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-sm border border-[var(--line)] bg-white/70 px-3 py-2"
              >
                <div className="text-[10px] text-[var(--muted)]">{label}</div>
                <div className="text-lg font-medium">{value}</div>
              </div>
            ))}
          </div>
        )}

        {message && (
          <div className="mb-3 text-sm text-[var(--accent)]">{message}</div>
        )}

        {tab === "places" ? (
          <>
            <div className="mb-3 flex flex-wrap gap-2 rounded-sm border border-[var(--line)] bg-white/70 p-3 text-sm">
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="rounded-sm border border-[var(--line)] px-2 py-1"
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
                <option value="all">all</option>
              </select>
              <select
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                className="rounded-sm border border-[var(--line)] px-2 py-1"
              >
                <option value="">全部地区</option>
                <option value="tokyo-core">核心 10 区</option>
                <option value="pref-13">东京都</option>
                {Object.entries(WARD_LABELS)
                  .filter(([id]) => id.startsWith("ward-"))
                  .map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                <option value="missing">无 Region</option>
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-sm border border-[var(--line)] px-2 py-1"
              >
                <option value="">全部类型</option>
                {Object.entries(CATEGORY_LABEL).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
                className="rounded-sm border border-[var(--line)] px-2 py-1"
              >
                <option value="">全部 importance</option>
                <option value="1">1 national</option>
                <option value="2">2 regional</option>
                <option value="3">3 local</option>
              </select>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="rounded-sm border border-[var(--line)] px-2 py-1"
              >
                <option value="">全部来源</option>
                <option value="imported">imported</option>
                <option value="curated">curated</option>
                <option value="custom">custom</option>
              </select>
              <select
                value={layerId}
                onChange={(e) => setLayerId(e.target.value)}
                className="rounded-sm border border-[var(--line)] px-2 py-1"
              >
                <option value="">全部 View</option>
                {layers.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))}
              </select>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索名称"
                className="min-w-[140px] flex-1 rounded-sm border border-[var(--line)] px-2 py-1"
              />
              <button
                type="button"
                onClick={() => void fetch("/api/admin/review?dedupe=1").then(reload)}
                className="rounded-sm border border-[var(--line)] bg-white px-2 py-1"
              >
                扫描重复
              </button>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-sm border border-[var(--line)] bg-[var(--panel)] p-3 text-sm">
              <button type="button" onClick={toggleAll} className="underline">
                {selected.size === items.length ? "取消全选" : "全选本页"}
              </button>
              <span className="text-[var(--muted)]">
                已选 {selected.size} / 本页 {items.length} · 共 {total}
              </span>
              <button
                type="button"
                disabled={!selectedIds.length}
                onClick={() =>
                  batch({ placeIds: selectedIds, reviewStatus: "approved" })
                }
                className="rounded-sm bg-[var(--accent)] px-2 py-1 text-white disabled:opacity-40"
              >
                批量 Approve
              </button>
              <button
                type="button"
                disabled={!selectedIds.length}
                onClick={() =>
                  batch({ placeIds: selectedIds, reviewStatus: "rejected" })
                }
                className="rounded-sm border border-[var(--line)] bg-white px-2 py-1 disabled:opacity-40"
              >
                批量 Reject
              </button>
              <select
                value={batchLayerId}
                onChange={(e) => setBatchLayerId(e.target.value)}
                className="rounded-sm border border-[var(--line)] px-2 py-1"
              >
                {layers.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedIds.length}
                onClick={() =>
                  batch({
                    placeIds: selectedIds,
                    addLayerId: batchLayerId,
                    reviewStatus: "approved",
                  })
                }
                className="rounded-sm border border-[var(--line)] bg-white px-2 py-1 disabled:opacity-40"
              >
                加入 View + Approve
              </button>
            </div>

            {loading ? (
              <div className="text-sm text-[var(--muted)]">加载中…</div>
            ) : (
              <ul className="space-y-3">
                {items.map((place) => (
                  <li
                    key={place.id}
                    className="rounded-sm border border-[var(--line)] bg-white/80 p-3"
                  >
                    <div className="flex flex-wrap gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(place.id)}
                        onChange={() => toggle(place.id)}
                        className="mt-1"
                      />
                      <div className="h-20 w-28 shrink-0 overflow-hidden rounded-sm bg-[var(--accent-soft)]">
                        {place.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={place.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-[var(--muted)]">
                            无图
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h2 className="text-lg font-medium">{place.name}</h2>
                          <span className="text-xs text-[var(--muted)]">
                            {place.nameJa || place.nameEn || ""}
                          </span>
                          <span className="rounded-sm bg-[var(--accent-soft)] px-1.5 text-[10px]">
                            {place.reviewStatus}
                          </span>
                          {place.warnings.map((w) => (
                            <span
                              key={w}
                              className="rounded-sm bg-[#f8ece8] px-1.5 text-[10px] text-red-800"
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          {CATEGORY_LABEL[place.category as keyof typeof CATEGORY_LABEL] ??
                            place.category}{" "}
                          · imp {place.importance} ·{" "}
                          {WARD_LABELS[place.regionId ?? "missing"] ??
                            place.regionId ??
                            "no region"}{" "}
                          · {place.sourceType}
                          {place.provider
                            ? ` · ${place.provider}:${place.externalId}`
                            : ""}
                        </div>
                        <p className="mt-1 text-sm leading-5 text-[var(--ink)]/85">
                          {place.description || "（无描述）"}
                        </p>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          Views:{" "}
                          {place.layers.length
                            ? place.layers.map((l) => l.name).join(" · ")
                            : "—"}
                          {place.possibleDuplicateOf
                            ? ` · dup→ ${place.possibleDuplicateOf}`
                            : ""}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-sm bg-[var(--accent)] px-2 py-1 text-xs text-white"
                            onClick={() =>
                              patchOne(place.id, { reviewStatus: "approved" })
                            }
                          >
                            保留
                          </button>
                          <button
                            type="button"
                            className="rounded-sm border border-[var(--line)] px-2 py-1 text-xs"
                            onClick={() =>
                              patchOne(place.id, { reviewStatus: "rejected" })
                            }
                          >
                            排除
                          </button>
                          {[1, 2, 3].map((n) => (
                            <button
                              key={n}
                              type="button"
                              className="rounded-sm border border-[var(--line)] px-2 py-1 text-xs"
                              onClick={() =>
                                patchOne(place.id, { importance: n })
                              }
                            >
                              imp{n}
                            </button>
                          ))}
                          <select
                            className="rounded-sm border border-[var(--line)] px-1 py-1 text-xs"
                            defaultValue={place.category}
                            onChange={(e) =>
                              patchOne(place.id, { category: e.target.value })
                            }
                          >
                            {Object.entries(CATEGORY_LABEL).map(([id, label]) => (
                              <option key={id} value={id}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <Link
                            href={`/?lat=${place.latitude}&lng=${place.longitude}&zoom=15&place=${place.id}`}
                            className="rounded-sm border border-[var(--line)] px-2 py-1 text-xs text-[var(--accent)]"
                            target="_blank"
                          >
                            地图查看
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-sm bg-[var(--accent)] px-3 py-1.5 text-sm text-white"
                onClick={async () => {
                  await fetch("/api/admin/views", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "ensure-tokyo-views" }),
                  });
                  setMessage("已确保东京 Explore Views");
                  await reload();
                }}
              >
                确保东京 Views 存在
              </button>
            </div>
            <ul className="space-y-3">
              {layers
                .filter((l) => !l.regionId || l.regionId === "pref-13")
                .map((layer) => (
                  <li
                    key={layer.id}
                    className="rounded-sm border border-[var(--line)] bg-white/80 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-lg font-medium">{layer.name}</h2>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {layer.description}
                        </p>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          {layer.id} · {layer.regionId ?? "cross-region"} ·{" "}
                          {layer.visibility}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-sm border border-[var(--line)] px-2 py-1 text-xs"
                        onClick={async () => {
                          const res = await fetch(
                            `/api/admin/views?layerId=${layer.id}&candidates=1`
                          );
                          const data = (await res.json()) as {
                            candidates: typeof candidates;
                          };
                          setCandidates(data.candidates);
                          setBatchLayerId(layer.id);
                          setMessage(`候选 ${data.candidates.length} · ${layer.name}`);
                        }}
                      >
                        生成候选
                      </button>
                    </div>
                  </li>
                ))}
            </ul>
            {candidates.length > 0 && (
              <div className="rounded-sm border border-[var(--line)] bg-white p-3">
                <div className="mb-2 text-sm font-medium">
                  候选地点（未自动加入）→ {batchLayerId}
                </div>
                <ul className="space-y-2 text-sm">
                  {candidates.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)]/50 py-2"
                    >
                      <span>
                        {c.name} · {c.category} · imp{c.importance}
                      </span>
                      <button
                        type="button"
                        className="rounded-sm bg-[var(--accent)] px-2 py-1 text-xs text-white"
                        onClick={() =>
                          batch({
                            placeIds: [c.id],
                            addLayerId: batchLayerId,
                            reviewStatus: "approved",
                            layerNote: `${c.name}——主题候选。`,
                          })
                        }
                      >
                        加入并 Approve
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
