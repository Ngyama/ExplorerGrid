import type { PlaceCategory } from "@/types/place";

export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
  museum: "博物馆",
  art_museum: "美术馆",
  aquarium: "水族馆",
  zoo: "动物园",
  park: "公园",
  garden: "庭园",
  shrine: "神社",
  temple: "寺院",
  castle: "城郭",
  landmark: "地标",
  observation: "展望",
  bookstore: "书店",
  memorial: "纪念馆",
  street: "街区",
  cafe: "咖啡馆",
  restaurant: "餐厅",
  theme_park: "主题乐园",
  nature: "自然",
  cinema: "影院",
  other: "其他",
};

/** Stroke icons, 24×24. Shared by map markers and UI. */
export const CATEGORY_ICON_PATHS: Record<PlaceCategory, string> = {
  museum: [
    '<path d="M3 21h18" />',
    '<path d="M5 21V9l7-5 7 5v12" />',
    '<path d="M9 21v-6h6v6" />',
  ].join(""),
  art_museum: [
    '<path d="M3 21h18" />',
    '<path d="M5 21V9l7-5 7 5v12" />',
    '<path d="M9 12h6" />',
    '<path d="M12 9v6" />',
  ].join(""),
  aquarium: [
    '<path d="M3 12c2-4 6-6 9-6s7 2 9 6c-2 4-6 6-9 6s-7-2-9-6z" />',
    '<path d="M12 10v.01" />',
  ].join(""),
  zoo: [
    '<path d="M12 4c2 2 3 4 3 6a3 3 0 1 1-6 0c0-2 1-4 3-6z" />',
    '<path d="M8 20c1-3 2.5-5 4-5s3 2 4 5" />',
  ].join(""),
  park: [
    '<path d="M12 22v-7" />',
    '<path d="M8 15c-3.5-1.5-3-7 1-8 1.2-3 6.2-3 7.5 0 4 1 4.5 6.5 1 8H8z" />',
  ].join(""),
  garden: [
    '<path d="M12 22V12" />',
    '<path d="M8 12c-2-3 0-7 4-8 4 1 6 5 4 8H8z" />',
    '<path d="M5 22h14" />',
  ].join(""),
  shrine: [
    '<path d="M4 8h16" />',
    '<path d="M6 4h12" />',
    '<path d="M8 4v17" />',
    '<path d="M16 4v17" />',
  ].join(""),
  temple: [
    '<path d="M4 10h16" />',
    '<path d="M6 6h12" />',
    '<path d="M8 6v15" />',
    '<path d="M16 6v15" />',
    '<path d="M12 3v3" />',
  ].join(""),
  castle: [
    '<path d="M4 21h16" />',
    '<path d="M6 21V10l3-3 3 3 3-3 3 3v11" />',
    '<path d="M10 21v-5h4v5" />',
  ].join(""),
  landmark: [
    '<path d="M3 21h18" />',
    '<path d="M12 3l7 6H5l7-6z" />',
    '<path d="M7 21V11h10v10" />',
  ].join(""),
  observation: [
    '<path d="M12 3v18" />',
    '<path d="M5 10h14" />',
    '<path d="M8 21h8" />',
    '<circle cx="12" cy="7" r="2" />',
  ].join(""),
  bookstore: [
    '<path d="M4 19a2 2 0 0 0 2 2h12" />',
    '<path d="M6 21V5a2 2 0 0 1 2-2h10v16" />',
  ].join(""),
  memorial: [
    '<path d="M12 3v4" />',
    '<path d="M9 7h6" />',
    '<path d="M8 21V10h8v11" />',
  ].join(""),
  street: [
    '<path d="M4 10h16" />',
    '<path d="M4 14h16" />',
    '<path d="M9 10v4" />',
    '<path d="M15 10v4" />',
  ].join(""),
  cafe: [
    '<path d="M5 8h10v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z" />',
    '<path d="M15 10h1.5a2.5 2.5 0 0 1 0 5H15" />',
  ].join(""),
  restaurant: [
    '<path d="M4 3v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3" />',
    '<path d="M6 13v8" />',
    '<path d="M16 3v18" />',
  ].join(""),
  theme_park: [
    '<path d="M12 3l2 6h6l-5 4 2 6-5-3.5L7 19l2-6-5-4h6z" />',
  ].join(""),
  nature: [
    '<path d="M4 20c4-8 8-12 8-12s4 4 8 12" />',
    '<path d="M12 8v12" />',
  ].join(""),
  cinema: [
    '<path d="M3 8h12v10H3z" />',
    '<path d="M15 10l6-3v10l-6-3" />',
  ].join(""),
  other: [
    '<circle cx="12" cy="12" r="8" />',
    '<path d="M12 8v4" />',
    '<path d="M12 16h.01" />',
  ].join(""),
};

export function isPlaceCategory(value: string): value is PlaceCategory {
  return value in CATEGORY_LABEL;
}

export function categoryLabel(category: string): string {
  return isPlaceCategory(category) ? CATEGORY_LABEL[category] : category;
}

/** Map unknown/legacy labels into the closed set. */
export function normalizeCategory(value: string): PlaceCategory {
  if (isPlaceCategory(value)) return value;
  // Legacy: shrine covered temples
  if (value === "shrine_temple") return "shrine";
  return "other";
}
