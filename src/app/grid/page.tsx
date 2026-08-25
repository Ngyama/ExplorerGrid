import { GridView } from "@/features/grid/GridView";
import { getGrid } from "@/lib/repositories/places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function GridPage() {
  const groups = getGrid();
  return (
    <div className="bg-[radial-gradient(circle_at_top,_#ebe4d6,_#f3efe6_40%,_#e4ddd0)]">
      <GridView groups={groups} />
    </div>
  );
}
