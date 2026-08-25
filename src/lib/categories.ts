import type { PlaceCategory } from "@/types/place";

export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
  museum: "博物馆",
  restaurant: "餐厅",
  cafe: "咖啡馆",
  landmark: "地标",
  park: "公园",
  shrine: "神社寺院",
  cinema: "影院",
  street: "街区",
  bookstore: "书店",
  memorial: "纪念馆",
};

/** Stroke icons, 24×24, Lucide-like. Shared by map markers and UI. */
export const CATEGORY_ICON_PATHS: Record<PlaceCategory, string> = {
  museum: [
    '<path d="M3 21h18" />',
    '<path d="M5 21V9l7-5 7 5v12" />',
    '<path d="M9 21v-6h6v6" />',
    '<path d="M9 11v.01" />',
    '<path d="M15 11v.01" />',
  ].join(""),
  landmark: [
    '<path d="M3 21h18" />',
    '<path d="M12 3l7 6H5l7-6z" />',
    '<path d="M7 21V11h10v10" />',
    '<path d="M10 21v-5h4v5" />',
  ].join(""),
  park: [
    '<path d="M12 22v-7" />',
    '<path d="M8 15c-3.5-1.5-3-7 1-8 1.2-3 6.2-3 7.5 0 4 1 4.5 6.5 1 8H8z" />',
  ].join(""),
  shrine: [
    '<path d="M4 8h16" />',
    '<path d="M6 4h12" />',
    '<path d="M8 4v17" />',
    '<path d="M16 4v17" />',
    '<path d="M4 8l2-4" />',
    '<path d="M20 8l-2-4" />',
  ].join(""),
  cafe: [
    '<path d="M5 8h10v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z" />',
    '<path d="M15 10h1.5a2.5 2.5 0 0 1 0 5H15" />',
    '<path d="M8 3v2" />',
    '<path d="M12 3v2" />',
  ].join(""),
  restaurant: [
    '<path d="M4 3v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3" />',
    '<path d="M6 13v8" />',
    '<path d="M4 7h4" />',
    '<path d="M16 3v18" />',
    '<path d="M16 8s3-1 3 3v0" />',
  ].join(""),
  bookstore: [
    '<path d="M4 19a2 2 0 0 0 2 2h12" />',
    '<path d="M6 21V5a2 2 0 0 1 2-2h10v16" />',
    '<path d="M8 7h6" />',
    '<path d="M8 11h6" />',
  ].join(""),
  memorial: [
    '<path d="M12 3v4" />',
    '<path d="M9 7h6" />',
    '<path d="M8 21V10h8v11" />',
    '<path d="M5 21h14" />',
  ].join(""),
  street: [
    '<path d="M4 10h16" />',
    '<path d="M4 14h16" />',
    '<path d="M9 10v4" />',
    '<path d="M15 10v4" />',
    '<path d="M12 4v3" />',
    '<path d="M12 17v3" />',
  ].join(""),
  cinema: [
    '<path d="M3 8h12v10H3z" />',
    '<path d="M15 10l6-3v10l-6-3" />',
    '<path d="M7 8V6" />',
    '<path d="M11 8V6" />',
  ].join(""),
};

export function isPlaceCategory(value: string): value is PlaceCategory {
  return value in CATEGORY_LABEL;
}

export function categoryLabel(category: string): string {
  return isPlaceCategory(category) ? CATEGORY_LABEL[category] : category;
}
