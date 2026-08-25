import { notFound } from "next/navigation";
import { PlaceDetail } from "@/features/places/PlaceDetail";
import { getPlaceById } from "@/lib/repositories/places";

export const runtime = "nodejs";

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const place = getPlaceById(id);
  if (!place) notFound();

  return (
    <div className="bg-[radial-gradient(circle_at_top,_#ebe4d6,_#f3efe6_45%,_#e7e0d2)]">
      <PlaceDetail place={place} />
    </div>
  );
}
