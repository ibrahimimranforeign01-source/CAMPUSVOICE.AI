export type Category =
  | "Gate"
  | "Admin"
  | "Library"
  | "Health"
  | "Worship"
  | "Food"
  | "Hall"
  | "Faculty"
  | "ICT";

export type CampusLocation = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: Category;
  building: string;
  landmarks: string[];
  coordsVerified: boolean;
};

export type Coord = { lat: number; lng: number };

export type Screen =
  | "home"
  | "permission"
  | "search"
  | "details"
  | "navigate"
  | "complete"
  | "error";

export type RouteInfo = {
  points: Coord[];
  distanceMeters: number;
  durationMinutes: number;
  steps: string[];
  source: "osrm" | "straight-line";
};
