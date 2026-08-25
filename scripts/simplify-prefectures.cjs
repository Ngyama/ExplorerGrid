/**
 * Simplify Japan prefecture GeoJSON for ExplorerGrid region detection.
 * Input: public/geo/japan-raw.geojson
 * Output: public/geo/prefectures.json
 */
const fs = require("fs");
const path = require("path");

const input = path.join(__dirname, "../public/geo/japan-raw.geojson");
const output = path.join(__dirname, "../public/geo/prefectures.json");

function simplifyRing(ring, tolerance) {
  if (ring.length < 8) return ring;
  // Ramer–Douglas–Peucker
  function dist(p, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    if (dx === 0 && dy === 0) {
      const ex = p[0] - a[0];
      const ey = p[1] - a[1];
      return Math.sqrt(ex * ex + ey * ey);
    }
    const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
    const px = a[0] + t * dx;
    const py = a[1] + t * dy;
    const ex = p[0] - px;
    const ey = p[1] - py;
    return Math.sqrt(ex * ex + ey * ey);
  }

  function rdp(points, eps) {
    if (points.length <= 2) return points;
    let maxD = 0;
    let idx = 0;
    const end = points.length - 1;
    for (let i = 1; i < end; i++) {
      const d = dist(points[i], points[0], points[end]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > eps) {
      const left = rdp(points.slice(0, idx + 1), eps);
      const right = rdp(points.slice(idx), eps);
      return left.slice(0, -1).concat(right);
    }
    return [points[0], points[end]];
  }

  const closed =
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1];
  const open = closed ? ring.slice(0, -1) : ring.slice();
  const simplified = rdp(open, tolerance);
  if (simplified.length < 4) return ring;
  if (
    simplified[0][0] !== simplified[simplified.length - 1][0] ||
    simplified[0][1] !== simplified[simplified.length - 1][1]
  ) {
    simplified.push(simplified[0]);
  }
  return simplified;
}

function simplifyCoords(coords, type, tolerance) {
  if (type === "Polygon") {
    return coords.map((ring) => simplifyRing(ring, tolerance));
  }
  if (type === "MultiPolygon") {
    return coords.map((poly) =>
      poly.map((ring) => simplifyRing(ring, tolerance))
    );
  }
  return coords;
}

const raw = JSON.parse(fs.readFileSync(input, "utf8"));
const features = raw.features.map((f) => ({
  type: "Feature",
  properties: {
    id: `pref-${String(f.properties.id).padStart(2, "0")}`,
    code: String(f.properties.id).padStart(2, "0"),
    name: f.properties.nam,
    nameJa: f.properties.nam_ja,
    type: "prefecture",
    parentId: "japan",
  },
  geometry: {
    type: f.geometry.type,
    coordinates: simplifyCoords(f.geometry.coordinates, f.geometry.type, 0.02),
  },
}));

const collection = { type: "FeatureCollection", features };
fs.writeFileSync(output, JSON.stringify(collection));
console.log(
  `Wrote ${features.length} prefectures → ${output} (${(
    fs.statSync(output).size / 1024
  ).toFixed(1)} KB)`
);
