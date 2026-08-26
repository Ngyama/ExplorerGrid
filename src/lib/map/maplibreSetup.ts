"use client";

import { setWorkerUrl } from "maplibre-gl";

let configured = false;

/** MapLibre v6 worker must be served from public/ in Next.js (see maplibre.org docs). */
export function ensureMapLibreWorker(): void {
  if (configured || typeof window === "undefined") return;
  setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
  configured = true;
}

ensureMapLibreWorker();
