/**
 * Build a chome-like micro-grid for Tokyo 23 wards (irregular cells clipped to ward polygons).
 * Output: public/geo/tokyo-chome.json
 */
import fs from "fs";
import path from "path";
import {
  featureBBox,
  pointInFeature,
  type RegionFeature,
  type RegionFeatureCollection,
} from "../src/lib/geo/regions";

/** ~700 m cells — ~800 micro-regions across 23 wards. */
const CELL_DEG = 0.008;

function cellPolygon(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): GeoJSON.Polygon {
  return {
    type: "Polygon",
    coordinates: [
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ],
  };
}

function main() {
  const wardsPath = path.join(process.cwd(), "public/geo/tokyo-wards.json");
  const outPath = path.join(process.cwd(), "public/geo/tokyo-chome.json");

  const wards = JSON.parse(
    fs.readFileSync(wardsPath, "utf8")
  ) as RegionFeatureCollection;

  const features: GeoJSON.Feature[] = [];

  for (const ward of wards.features) {
    const [minX, minY, maxX, maxY] = featureBBox(ward);
    let index = 0;

    for (let lat = minY; lat < maxY; lat += CELL_DEG) {
      for (let lng = minX; lng < maxX; lng += CELL_DEG) {
        const maxLng = lng + CELL_DEG;
        const maxLat = lat + CELL_DEG;
        const centerLng = lng + CELL_DEG / 2;
        const centerLat = lat + CELL_DEG / 2;

        if (!pointInFeature(centerLng, centerLat, ward)) continue;

        const code = ward.properties.code ?? ward.properties.id.replace("ward-", "");
        const id = `chome-${code}-${String(index).padStart(3, "0")}`;
        index += 1;

        features.push({
          type: "Feature",
          id,
          properties: {
            id,
            wardId: ward.properties.id,
            parentId: ward.properties.parentId,
            type: "chome",
          },
          geometry: cellPolygon(lng, lat, maxLng, maxLat),
        });
      }
    }
  }

  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features,
  };

  fs.writeFileSync(outPath, JSON.stringify(collection));
  console.log(`Wrote ${features.length} chome cells → ${outPath}`);
}

main();
