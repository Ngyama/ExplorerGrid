import { categoryIconMarkup } from "@/components/CategoryIcon";
import { categoryLabel } from "@/lib/categories";
import type { MapPlaceMarker } from "@/types/explore";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusClass(status: MapPlaceMarker["status"]) {
  if (status === "visited") return "is-visited";
  if (status === "want_to_go") return "is-want";
  return "is-unvisited";
}

function iconStroke(status: MapPlaceMarker["status"]) {
  if (status === "visited") return "#f6f1e8";
  if (status === "want_to_go") return "#3b6ea5";
  return "#2f5d50";
}

export function createPlaceMarkerElement(place: MapPlaceMarker): HTMLButtonElement {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `eg-node ${statusClass(place.status)}`;
  el.setAttribute("aria-label", `${place.name}，${categoryLabel(place.category)}`);
  el.dataset.placeId = place.id;

  const iconColor = iconStroke(place.status);
  el.innerHTML = `
    <span class="eg-node__glow"></span>
    <span class="eg-node__core">
      ${categoryIconMarkup(place.category, 13, iconColor)}
    </span>
    <span class="eg-node__label">${escapeHtml(place.name)}</span>
  `;

  return el;
}
