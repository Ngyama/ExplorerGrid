import { Suspense } from "react";
import { MapExplorer } from "@/features/map/MapExplorer";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] items-center justify-center text-sm text-[var(--muted)]">
          正在打开地图…
        </div>
      }
    >
      <MapExplorer />
    </Suspense>
  );
}
