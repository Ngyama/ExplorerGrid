/**
 * Assign ExplorerGrid regionId from lon/lat using lightweight prefecture bboxes.
 * Ward-level assignment for Tokyo 23 wards when possible.
 */

type PrefBox = {
  id: string;
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
};

/** Approximate prefecture bounding boxes (good enough for import region tagging). */
const PREF_BOXES: PrefBox[] = [
  { id: "pref-01", minLon: 139.3, minLat: 41.3, maxLon: 145.9, maxLat: 45.6 }, // Hokkaido
  { id: "pref-02", minLon: 139.4, minLat: 40.2, maxLon: 141.7, maxLat: 41.6 },
  { id: "pref-03", minLon: 140.6, minLat: 38.7, maxLon: 142.1, maxLat: 40.5 },
  { id: "pref-04", minLon: 140.2, minLat: 37.7, maxLon: 141.7, maxLat: 39.1 },
  { id: "pref-05", minLon: 139.5, minLat: 38.8, maxLon: 140.9, maxLat: 40.5 },
  { id: "pref-06", minLon: 139.5, minLat: 37.7, maxLon: 140.7, maxLat: 39.2 },
  { id: "pref-07", minLon: 139.1, minLat: 36.7, maxLon: 141.1, maxLat: 37.9 },
  { id: "pref-08", minLon: 139.6, minLat: 35.7, maxLon: 140.9, maxLat: 36.9 },
  { id: "pref-09", minLon: 139.3, minLat: 36.2, maxLon: 140.3, maxLat: 37.2 },
  { id: "pref-10", minLon: 138.4, minLat: 35.9, maxLon: 139.9, maxLat: 37.2 },
  { id: "pref-11", minLon: 138.7, minLat: 35.7, maxLon: 139.9, maxLat: 36.3 },
  { id: "pref-12", minLon: 139.7, minLat: 34.9, maxLon: 140.9, maxLat: 36.1 },
  { id: "pref-13", minLon: 138.9, minLat: 35.5, maxLon: 139.9, maxLat: 35.9 }, // Tokyo
  { id: "pref-14", minLon: 138.9, minLat: 35.1, maxLon: 139.8, maxLat: 35.7 },
  { id: "pref-15", minLon: 137.6, minLat: 36.7, maxLon: 139.9, maxLat: 38.6 },
  { id: "pref-16", minLon: 136.7, minLat: 36.2, maxLon: 137.8, maxLat: 37.0 },
  { id: "pref-17", minLon: 136.2, minLat: 36.0, maxLon: 137.4, maxLat: 37.9 },
  { id: "pref-18", minLon: 135.4, minLat: 35.4, maxLon: 136.9, maxLat: 36.3 },
  { id: "pref-19", minLon: 138.2, minLat: 35.1, maxLon: 139.2, maxLat: 35.9 },
  { id: "pref-20", minLon: 137.3, minLat: 35.2, maxLon: 138.8, maxLat: 37.0 },
  { id: "pref-21", minLon: 136.3, minLat: 35.1, maxLon: 137.7, maxLat: 36.5 },
  { id: "pref-22", minLon: 137.4, minLat: 34.5, maxLon: 139.2, maxLat: 35.7 },
  { id: "pref-23", minLon: 136.6, minLat: 34.5, maxLon: 137.9, maxLat: 35.5 },
  { id: "pref-24", minLon: 135.8, minLat: 33.7, maxLon: 136.9, maxLat: 35.3 },
  { id: "pref-25", minLon: 135.7, minLat: 34.9, maxLon: 136.5, maxLat: 35.7 },
  { id: "pref-26", minLon: 134.8, minLat: 34.7, maxLon: 136.1, maxLat: 35.8 }, // Kyoto
  { id: "pref-27", minLon: 135.0, minLat: 34.2, maxLon: 135.8, maxLat: 35.0 }, // Osaka
  { id: "pref-28", minLon: 134.2, minLat: 34.1, maxLon: 135.5, maxLat: 35.7 },
  { id: "pref-29", minLon: 135.5, minLat: 33.8, maxLon: 136.1, maxLat: 34.8 },
  { id: "pref-30", minLon: 135.0, minLat: 33.4, maxLon: 136.1, maxLat: 34.4 },
  { id: "pref-31", minLon: 133.1, minLat: 35.0, maxLon: 134.6, maxLat: 35.6 },
  { id: "pref-32", minLon: 131.6, minLat: 34.2, maxLon: 133.4, maxLat: 36.4 },
  { id: "pref-33", minLon: 133.2, minLat: 34.4, maxLon: 134.5, maxLat: 35.4 },
  { id: "pref-34", minLon: 132.0, minLat: 34.0, maxLon: 133.5, maxLat: 35.1 }, // Hiroshima
  { id: "pref-35", minLon: 130.8, minLat: 33.7, maxLon: 132.3, maxLat: 34.8 },
  { id: "pref-36", minLon: 133.6, minLat: 33.4, maxLon: 134.9, maxLat: 34.3 },
  { id: "pref-37", minLon: 133.4, minLat: 34.0, maxLon: 134.5, maxLat: 34.6 },
  { id: "pref-38", minLon: 132.0, minLat: 32.7, maxLon: 133.8, maxLat: 34.4 },
  { id: "pref-39", minLon: 132.4, minLat: 32.7, maxLon: 134.4, maxLat: 33.9 },
  { id: "pref-40", minLon: 130.0, minLat: 33.0, maxLon: 131.3, maxLat: 34.0 }, // Fukuoka
  { id: "pref-41", minLon: 129.7, minLat: 32.9, maxLon: 130.6, maxLat: 33.7 },
  { id: "pref-42", minLon: 128.6, minLat: 32.5, maxLon: 130.5, maxLat: 34.8 },
  { id: "pref-43", minLon: 130.0, minLat: 32.0, maxLon: 131.4, maxLat: 33.3 },
  { id: "pref-44", minLon: 131.0, minLat: 32.7, maxLon: 132.1, maxLat: 33.8 },
  { id: "pref-45", minLon: 130.6, minLat: 31.3, maxLon: 131.9, maxLat: 32.9 },
  { id: "pref-46", minLon: 129.4, minLat: 27.0, maxLon: 131.3, maxLat: 32.3 },
  { id: "pref-47", minLon: 122.9, minLat: 24.0, maxLon: 131.4, maxLat: 27.9 }, // Okinawa
];

/** Rough Tokyo ward centers for nearest-ward assignment inside pref-13. */
const TOKYO_WARD_CENTERS: Array<{ id: string; lat: number; lon: number }> = [
  { id: "ward-13101", lat: 35.6938, lon: 139.7536 }, // Chiyoda
  { id: "ward-13102", lat: 35.6939, lon: 139.7036 }, // Chuo
  { id: "ward-13103", lat: 35.6581, lon: 139.7514 }, // Minato
  { id: "ward-13104", lat: 35.6939, lon: 139.7034 }, // Shinjuku
  { id: "ward-13105", lat: 35.7090, lon: 139.7320 }, // Bunkyo
  { id: "ward-13106", lat: 35.7126, lon: 139.7800 }, // Taito
  { id: "ward-13107", lat: 35.7101, lon: 139.8107 }, // Sumida
  { id: "ward-13108", lat: 35.6714, lon: 139.8174 }, // Koto
  { id: "ward-13109", lat: 35.6466, lon: 139.6533 }, // Shinagawa
  { id: "ward-13110", lat: 35.6263, lon: 139.7400 }, // Meguro
  { id: "ward-13111", lat: 35.6051, lon: 139.6823 }, // Ota
  { id: "ward-13112", lat: 35.6467, lon: 139.6532 }, // Setagaya
  { id: "ward-13113", lat: 35.6640, lon: 139.6982 }, // Shibuya
  { id: "ward-13114", lat: 35.7074, lon: 139.6638 }, // Nakano
  { id: "ward-13115", lat: 35.7295, lon: 139.6365 }, // Suginami
  { id: "ward-13116", lat: 35.7295, lon: 139.7167 }, // Toshima
  { id: "ward-13117", lat: 35.7485, lon: 139.7573 }, // Kita
  { id: "ward-13118", lat: 35.7360, lon: 139.7834 }, // Arakawa
  { id: "ward-13119", lat: 35.7500, lon: 139.8475 }, // Itabashi
  { id: "ward-13120", lat: 35.7745, lon: 139.7335 }, // Nerima
  { id: "ward-13121", lat: 35.7880, lon: 139.8055 }, // Adachi
  { id: "ward-13122", lat: 35.7180, lon: 139.8615 }, // Katsushika
  { id: "ward-13123", lat: 35.6660, lon: 139.8738 }, // Edogawa
];

function inBox(lon: number, lat: number, box: PrefBox) {
  return (
    lon >= box.minLon &&
    lon <= box.maxLon &&
    lat >= box.minLat &&
    lat <= box.maxLat
  );
}

export function assignRegionId(longitude: number, latitude: number): string {
  // Prefer Tokyo ward when inside Tokyo-ish bbox
  const tokyo = PREF_BOXES.find((b) => b.id === "pref-13")!;
  if (inBox(longitude, latitude, tokyo)) {
    let best = TOKYO_WARD_CENTERS[0];
    let bestDist = Infinity;
    for (const ward of TOKYO_WARD_CENTERS) {
      const d =
        (ward.lat - latitude) ** 2 + (ward.lon - longitude) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = ward;
      }
    }
    return best.id;
  }

  for (const box of PREF_BOXES) {
    if (inBox(longitude, latitude, box)) return box.id;
  }
  return "japan";
}
