import type { CampusLocation, Coord }  from './types';
import { formatDistance, haversineMeters } from "./geo";

function fallbackLine(args: {
  destination: CampusLocation;
  remainingM: number;
  nextStep: string;
}): string {
  const near = args.destination.landmarks[0];
  if (args.remainingM < 40) {
    return `You have almost arrived at ${args.destination.name}. Look for ${args.destination.building}.`;
  }
  if (near) {
    return `${args.nextStep} Use ${near} as your landmark. You are about ${formatDistance(args.remainingM)} from ${args.destination.name}.`;
  }
  return `${args.nextStep} You are about ${formatDistance(args.remainingM)} from ${args.destination.name}.`;
}

export async function naturalInstruction(args: {
  originName: string;
  destination: CampusLocation;
  user: Coord;
  nextStep: string;
}): Promise<string> {
  const remainingM = haversineMeters(args.user, {
    lat: args.destination.latitude,
    lng: args.destination.longitude,
  });
  const local = fallbackLine({
    destination: args.destination,
    remainingM,
    nextStep: args.nextStep,
  });

  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return local;

  try {
    const prompt = `You are CampusVoice AI, a calm walking guide on the University of Ibadan campus.
Write ONE short spoken instruction (max 28 words). Use campus landmarks. Do not invent streets you are unsure about.
From: ${args.originName}
To: ${args.destination.name} (${args.destination.building})
Landmarks: ${args.destination.landmarks.join(", ")}
Routing step: ${args.nextStep}
Remaining: ${Math.round(remainingM)} metres`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );
    if (!res.ok) return local;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || local;
  } catch {
    return local;
  }
}
