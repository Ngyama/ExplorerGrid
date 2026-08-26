import { GridView } from "@/features/grid/GridView";
import { getGrid } from "@/lib/repositories/places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function GridPage({
  searchParams,
}: {
  searchParams: Promise<{ regionId?: string }>;
}) {
  const params = await searchParams;
  const regionId = params.regionId || null;
  const groups = getGrid("local", { regionId });
  return (
    <div className="bg-[radial-gradient(circle_at_top,_#ebe4d6,_#f3efe6_40%,_#e4ddd0)]">
      <GridView groups={groups} regionId={regionId} />
    </div>
  );
}
