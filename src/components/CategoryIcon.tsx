import type { PlaceCategory } from "@/types/place";
import {
  CATEGORY_ICON_PATHS,
  CATEGORY_LABEL,
  isPlaceCategory,
} from "@/lib/categories";

interface CategoryIconProps {
  category: string;
  size?: number;
  className?: string;
  title?: string;
}

export function CategoryIcon({
  category,
  size = 16,
  className,
  title,
}: CategoryIconProps) {
  const key: PlaceCategory = isPlaceCategory(category) ? category : "other";
  const label = title ?? CATEGORY_LABEL[key];

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{label}</title> : null}
      <g dangerouslySetInnerHTML={{ __html: CATEGORY_ICON_PATHS[key] }} />
    </svg>
  );
}

export function categoryIconMarkup(
  category: string,
  size = 14,
  stroke = "currentColor"
): string {
  const key: PlaceCategory = isPlaceCategory(category) ? category : "other";
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CATEGORY_ICON_PATHS[key]}</svg>`;
}
