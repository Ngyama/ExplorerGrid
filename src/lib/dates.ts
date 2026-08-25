export function formatVisitDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatCoord(latitude: number, longitude: number): string {
  const latHemisphere = latitude >= 0 ? "N" : "S";
  const lngHemisphere = longitude >= 0 ? "E" : "W";
  return `${Math.abs(latitude).toFixed(4)}° ${latHemisphere}, ${Math.abs(longitude).toFixed(4)}° ${lngHemisphere}`;
}
