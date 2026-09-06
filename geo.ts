import type { Coord } from "../types";

const EARTH_M = 6371000;

export function haversineMeters(a: Coord, b: Coord): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 80));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function bearingDegrees(a: Coord, b: Coord): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.cos(toRad(b.lng - a.lng));
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export function compassLabel(deg: number): string {
  const n = (deg + 360) % 360;
  const labels = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"];
  return labels[Math.round(n / 45) % 8];
}
