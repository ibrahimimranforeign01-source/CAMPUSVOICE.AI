import { useEffect, useRef } from "react";
import { campusLocations } from './campusLocations';
   import type { Coord, CampusLocation } from './types';

type Props = {
  user?: Coord | null;
  destination?: CampusLocation | null;
  route?: Coord[];
  height?: string;
};

export function CampusMap({ user, destination, route, height = "100%" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    const L = window.L;
    if (!L || !ref.current || mapRef.current) return;
    const map = L.map(ref.current, { zoomControl: false }).setView(
      [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
      15,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 200);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    if (route && route.length > 1) {
      L.polyline(
        route.map((p) => [p.lat, p.lng]),
        { color: "#C9A227", weight: 5, opacity: 0.9 },
      ).addTo(layer);
    }

    if (user) {
      L.circleMarker([user.lat, user.lng], {
        radius: 9,
        color: "#fff",
        weight: 2,
        fillColor: "#2B6CB0",
        fillOpacity: 1,
      })
        .bindTooltip("You")
        .addTo(layer);
    }

    if (destination) {
      L.circleMarker([destination.latitude, destination.longitude], {
        radius: 9,
        color: "#fff",
        weight: 2,
        fillColor: "#C9A227",
        fillOpacity: 1,
      })
        .bindTooltip(destination.name)
        .addTo(layer);
    }

    const pts: [number, number][] = [];
    if (user) pts.push([user.lat, user.lng]);
    if (destination) pts.push([destination.latitude, destination.longitude]);
    if (pts.length === 2) map.fitBounds(pts, { padding: [40, 40] });
    else if (pts.length === 1) map.setView(pts[0], 16);
  }, [user, destination, route]);

  return <div ref={ref} className="map" style={{ height }} />;
}
