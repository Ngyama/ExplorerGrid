import { Suspense } from "react";
import { MapExplorer } from "@/features/map/MapExplorer";

export default function HomePage() {
  return (
    <div className="relative h-full min-h-0 w-full">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
            正在打开地图…
          </div>
        }
      >
        <MapExplorer />
      </Suspense>
    </div>
  );
}
