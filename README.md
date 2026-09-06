# CampusVoice AI — University of Ibadan

Voice-guided walking navigation for the University of Ibadan campus.

This is a frontend MVP: React + TypeScript + Leaflet + browser Geolocation + Web Speech + optional Gemini.

## What it does

1. Open the app and start navigation.
2. Allow location, or pick a UI landmark as a start point.
3. Search places such as Premier Gate, Kenneth Dike Library, Jaja Clinic, halls.
4. See distance and a walking route on the map.
5. Hear / read step-by-step instructions.
6. Arrival screen when you are close to the pin.

## How to run (on your computer)

cd campusvoice-ai
npm install
npm run dev

Open the local URL on your phone (same Wi-Fi) for a real GPS test.

## Optional Gemini

Create .env with VITE_GEMINI_API_KEY=your_key
Without a key the app still speaks using landmark templates.

## Explain in presentation

- Geolocation: navigator.geolocation.getCurrentPosition and watchPosition
- Map: Leaflet + OpenStreetMap in CampusMap.tsx
- Distance: Haversine in services/geo.ts. Walk time about 80m per minute
- Route: OSRM walking API, fallback straight line in services/route.ts
- Voice: speechSynthesis in services/speech.ts
- AI: Gemini only rewrites the current step in services/ai.ts
- Storage: localStorage recent places and voice preference

## UI data

src/data/campusLocations.ts
KDL coordinate is published. Other pins are approximate. Verify on campus and set coordsVerified true.

Demo: Premier Gate to Kenneth Dike Library.

## Deploy

GitHub + Vercel or Netlify. GPS needs HTTPS.

Do not commit API keys. Be ready to explain every file.
