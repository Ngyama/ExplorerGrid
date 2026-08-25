/**
 * Download & simplify Tokyo 23 wards GeoJSON for region detection.
 */
const fs = require("fs");
const path = require("path");

const WARDS = [
  ["13101", "千代田区", "Chiyoda"],
  ["13102", "中央区", "Chuo"],
  ["13103", "港区", "Minato"],
  ["13104", "新宿区", "Shinjuku"],
  ["13105", "文京区", "Bunkyo"],
  ["13106", "台東区", "Taito"],
  ["13107", "墨田区", "Sumida"],
  ["13108", "江東区", "Koto"],
  ["13109", "品川区", "Shinagawa"],
  ["13110", "目黒区", "Meguro"],
  ["13111", "大田区", "Ota"],
  ["13112", "世田谷区", "Setagaya"],
  ["13113", "渋谷区", "Shibuya"],
  ["13114", "中野区", "Nakano"],
  ["13115", "杉並区", "Suginami"],
  ["13116", "豊島区", "Toshima"],
  ["13117", "北区", "Kita"],
  ["13118", "荒川区", "Arakawa"],
  ["13119", "板橋区", "Itabashi"],
  ["13120", "練馬区", "Nerima"],
  ["13121", "足立区", "Adachi"],
  ["13122", "葛飾区", "Katsushika"],
  ["13123", "江戸川区", "Edogawa"],
];

function simplifyRing(ring, tolerance) {
  if (ring.length < 8) return ring;
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
    return Math.hypot(p[0] - px, p[1] - py);
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

function simplifyGeometry(geometry, tolerance) {
  if (geometry.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: geometry.coordinates.map((r) => simplifyRing(r, tolerance)),
    };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: geometry.coordinates.map((poly) =>
        poly.map((r) => simplifyRing(r, tolerance))
      ),
    };
  }
  return geometry;
}

async function main() {
  const features = [];
  for (const [code, nameJa, name] of WARDS) {
    const url = `https://cdn.jsdelivr.net/gh/niiyz/JapanCityGeoJson@master/geojson/13/${code}.json`;
    process.stdout.write(`Fetching ${nameJa}… `);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed ${code}: ${res.status}`);
    const geo = await res.json();
    const geometry =
      geo.type === "FeatureCollection"
        ? geo.features[0].geometry
        : geo.type === "Feature"
          ? geo.geometry
          : geo;
    features.push({
      type: "Feature",
      properties: {
        id: `ward-${code}`,
        code,
        name,
        nameJa,
        type: "ward",
        parentId: "pref-13",
      },
      geometry: simplifyGeometry(geometry, 0.0015),
    });
    console.log("ok");
  }

  const out = path.join(__dirname, "../public/geo/tokyo-wards.json");
  fs.writeFileSync(out, JSON.stringify({ type: "FeatureCollection", features }));
  console.log(
    `Wrote ${features.length} wards → ${out} (${(
      fs.statSync(out).size / 1024
    ).toFixed(1)} KB)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
