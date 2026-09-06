import type { Coord, RouteInfo } from "../types";
import { compassLabel, haversineMeters, walkingMinutes } from "./geo";

function straightRoute(start: Coord, end: Coord): RouteInfo {
  const distanceMeters = haversineMeters(start, end);
  const dir = compassLabel(bearingSafe(start, end));
  return {
    points: [start, end],
    distanceMeters,
    durationMinutes: walkingMinutes(distanceMeters),
    steps: [
      `Face ${dir} and begin walking toward your destination.`,
      `Continue for about ${Math.round(distanceMeters)} metres.`,
      "You should now be at the destination.",
    ],
    source: "straight-line",
  };
}

function bearingSafe(start: Coord, end: Coord): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(end.lng - start.lng)) * Math.cos(toRad(end.lat));
  const x =
    Math.cos(toRad(start.lat)) * Math.sin(toRad(end.lat)) -
    Math.sin(toRad(start.lat)) *
      Math.cos(toRad(end.lat)) *
      Math.cos(toRad(end.lng - start.lng));
  return (Math.atan2(y, x) * 180) / Math.PI;
}

export async function fetchRoute(start: Coord, end: Coord): Promise<RouteInfo> {
  const url =
    `https://router.project-osrm.org/route/v1/foot/` +
    `${start.lng},${start.lat};${end.lng},${end.lat}` +
    `?overview=full&geometries=geojson&steps=true`;

  try {
    const res = await fetch(url);
    if (!res.ok) return straightRoute(start, end);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return straightRoute(start, end);

    const coords = (route.geometry.coordinates as [number, number][]).map(
      ([lng, lat]) => ({ lat, lng }),
    );
    const steps: string[] = [];
    for (const leg of route.legs ?? []) {
      for (const step of leg.steps ?? []) {
        const name = step.name ? ` onto ${step.name}` : "";
        const type = step.maneuver?.type ?? "continue";
        const modifier = step.maneuver?.modifier ?? "";
        const dist = Math.round(step.distance ?? 0);
        steps.push(`${humanStep(type, modifier)}${name} (${dist}m)`.trim());
      }
    }
    if (steps.length === 0) return straightRoute(start, end);

    return {
      points: coords,
      distanceMeters: route.distance,
      durationMinutes: walkingMinutes(route.distance),
      steps,
      source: "osrm",
    };
  } catch {
    return straightRoute(start, end);
  }
}

function humanStep(type: string, modifier: string): string {
  if (type === "depart") return "Start walking";
  if (type === "arrive") return "Arrive at your destination";
  if (type === "turn") return `Turn ${modifier || "ahead"}`;
  if (type === "new name") return "Continue on the path";
  if (type === "merge") return "Merge with the path";
  if (type === "roundabout") return "Use the roundabout";
  if (type === "end of road") return `Turn ${modifier || "at the end of the road"}`;
  return modifier ? `${type} ${modifier}` : type;
}
