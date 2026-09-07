import { useEffect, useMemo, useState } from "react";
import type { CampusLocation, Coord, RouteInfo, Screen } from "./types";
import { CampusMap } from "./CampusMap";
import { campusLocations, categories } from "./campusLocations";
import { naturalInstruction } from "./ai";
import { formatDistance, haversineMeters, walkingMinutes } from "./geo";
import { fetchRoute } from "./route";
import { speak, stopSpeaking, voiceAvailable } from "./speech";
import { getRecentIds, getVoiceOn, pushRecent, setVoiceOn } from "./storage";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [user, setUser] = useState<Coord | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [destination, setDestination] = useState<CampusLocation | null>(null);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [voiceOn, setVoice] = useState(getVoiceOn());
  const [instruction, setInstruction] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [offRoute, setOffRoute] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campusLocations.filter((p) => {
      const okCat = cat === "All" || p.category === cat;
      const okQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.building.toLowerCase().includes(q) ||
        p.landmarks.some((l) => l.toLowerCase().includes(q));
      return okCat && okQ;
    });
  }, [query, cat]);

  useEffect(() => {
    setVoiceOn(voiceOn);
  }, [voiceOn]);

  useEffect(() => {
    if (!watching || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoError(null);
      },
      (err) => setGeoError(err.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 12000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [watching]);

  useEffect(() => {
    if (screen !== "navigate" || !user || !destination || !route) return;
    const dest = { lat: destination.latitude, lng: destination.longitude };
    const remain = haversineMeters(user, dest);
    if (remain < 35) {
      stopSpeaking();
      if (voiceOn) speak(`You have arrived at ${destination.name}.`);
      setScreen("complete");
      return;
    }
    const onLine = route.points.some((p) => haversineMeters(user, p) < 80);
    setOffRoute(!onLine && route.source === "osrm");
  }, [user, screen, destination, route, voiceOn]);

  async function requestLocation() {
    if (!navigator.geolocation) {
      setGeoError("This browser has no GPS. Pick a start point instead.");
      setScreen("search");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setWatching(true);
        setGeoError(null);
        setScreen("search");
      },
      (err) => {
        setGeoError(err.message || "Location permission denied.");
        setScreen("search");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function pickPlace(place: CampusLocation) {
    setDestination(place);
    pushRecent(place.id);
    setScreen("details");
  }

  async function startNav() {
    if (!destination) return;
    const origin =
      user ?? { lat: destination.latitude - 0.002, lng: destination.longitude + 0.002 };
    if (!user) setUser(origin);
    setLoadingRoute(true);
    const r = await fetchRoute(origin, {
      lat: destination.latitude,
      lng: destination.longitude,
    });
    setRoute(r);
    setStepIndex(0);
    setStartedAt(Date.now());
    setLoadingRoute(false);
    setScreen("navigate");
    const first = r.steps[0] ?? `Walk toward ${destination.name}.`;
    const spoken = await naturalInstruction({
      originName: "your start point",
      destination,
      user: origin,
      nextStep: first,
    });
    setInstruction(spoken);
    if (voiceOn) speak(spoken);
  }

  function endNav() {
    stopSpeaking();
    setScreen("search");
    setRoute(null);
    setOffRoute(false);
  }

  function nextStep() {
    if (!route) return;
    const n = Math.min(stepIndex + 1, route.steps.length - 1);
    setStepIndex(n);
    const line = route.steps[n];
    setInstruction(line);
    if (voiceOn) speak(line);
  }

  const remain =
    user && destination
      ? haversineMeters(user, { lat: destination.latitude, lng: destination.longitude })
      : destination && route
        ? route.distanceMeters
        : 0;

  const recent = getRecentIds()
    .map((id) => campusLocations.find((p) => p.id === id))
    .filter(Boolean) as CampusLocation[];

  const list = query || cat !== "All"
    ? results
    : [...recent, ...results.filter((p) => !recent.some((r) => r.id === p.id))];

  return (
    <div className="app">
      {screen === "home" && (
        <section className="page page-center">
          <div className="brand">
            <span className="logo">UI</span>
            <div>
              <strong>CampusVoice AI</strong>
              <p>University of Ibadan</p>
            </div>
          </div>
          <h1>Find your way around campus</h1>
          <p className="lead">
            Voice-guided walking directions for students and visitors at the University of Ibadan.
          </p>
          <button className="btn" onClick={() => setScreen("permission")}>
            Start Navigation
          </button>
          <p className="hint">Premier Gate to KDL, Jaja, halls and faculties</p>
        </section>
      )}

      {screen === "permission" && (
        <section className="page page-center">
          <div className="brand">
            <span className="logo">UI</span>
            <strong>CampusVoice AI</strong>
          </div>
          <div className="pin">+</div>
          <h1>Allow location access</h1>
          <p className="lead">
            CampusVoice AI needs your location to give accurate walking directions on the UI campus.
          </p>
          <button className="btn" onClick={() => void requestLocation()}>
            Allow location
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setGeoError("You chose a manual start. Pick any UI landmark.");
              setScreen("search");
            }}
          >
            Choose start point manually
          </button>
          <p className="hint">Your location stays in this browser.</p>
        </section>
      )}

      {screen === "search" && (
        <section className="page">
          <header className="top">
            <button className="back" onClick={() => setScreen("home")}>
              ‹
            </button>
            <h2>Where are you going?</h2>
          </header>
          {geoError && <div className="banner">{geoError} You can still pick a destination.</div>}
          <input
            className="search"
            placeholder="Search campus locations"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="chips">
            {categories.map((c) => (
              <button
                key={c}
                className={c === cat ? "chip on" : "chip"}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="list">
            {list.map((p) => (
              <button key={p.id} className="card" onClick={() => pickPlace(p)}>
                <div>
                  <strong>{p.name}</strong>
                  <span>
                    {p.category} · {p.building}
                  </span>
                </div>
                <em>
                  {user
                    ? formatDistance(haversineMeters(user, { lat: p.latitude, lng: p.longitude }))
                    : p.category}
                </em>
              </button>
            ))}
            {results.length === 0 && <p className="empty">No place matches that search.</p>}
          </div>
        </section>
      )}

      {screen === "details" && destination && (
        <section className="page">
          <div className="map-wrap short">
            <CampusMap user={user} destination={destination} height="100%" />
          </div>
          <header className="top">
            <button className="back" onClick={() => setScreen("search")}>
              ‹
            </button>
            <h2>{destination.name}</h2>
          </header>
          <p className="meta">
            {destination.building} · {destination.category}
          </p>
          <div className="stats">
            <div>
              <b>
                {user
                  ? formatDistance(
                      haversineMeters(user, {
                        lat: destination.latitude,
                        lng: destination.longitude,
                      }),
                    )
                  : "—"}
              </b>
              <span>Distance</span>
            </div>
            <div>
              <b>
                {user
                  ? `${walkingMinutes(
                      haversineMeters(user, {
                        lat: destination.latitude,
                        lng: destination.longitude,
                      }),
                    )} min`
                  : "—"}
              </b>
              <span>Walk</span>
            </div>
          </div>
          <p className="about">{destination.description}</p>
          {!destination.coordsVerified && (
            <p className="hint">Pin is approximate. Verify this coordinate on campus before your demo.</p>
          )}
          <button className="btn" onClick={() => void startNav()} disabled={loadingRoute}>
            {loadingRoute ? "Preparing route…" : "Start Navigation"}
          </button>
        </section>
      )}

      {screen === "navigate" && destination && (
        <section className="page nav-page">
          <div className="map-wrap">
            <CampusMap user={user} destination={destination} route={route?.points} height="100%" />
          </div>
          <div className="sheet">
            {offRoute && (
              <div className="banner warn">
                You may have left the path. Follow the gold line or the nearest landmark.
              </div>
            )}
            <p className="kicker">NEXT</p>
            <h2>{instruction || route?.steps[stepIndex] || "Continue walking"}</h2>
            <p className="remain">
              Remaining {formatDistance(remain)} · {walkingMinutes(remain)} min
              {route ? ` · ${route.source === "osrm" ? "OSRM walk" : "straight line"}` : ""}
            </p>
            <div className="controls">
              <button
                className="icon"
                onClick={() => {
                  const n = !voiceOn;
                  setVoice(n);
                  if (!n) stopSpeaking();
                }}
              >
                {voiceOn ? "Voice on" : "Voice off"}
              </button>
              <button className="icon" onClick={() => instruction && voiceOn && speak(instruction)}>
                Repeat
              </button>
              <button className="icon" onClick={nextStep}>
                Next step
              </button>
              <button className="danger" onClick={endNav}>
                End
              </button>
            </div>
            {!voiceAvailable() && <p className="hint">Voice is not available here. Use the text steps.</p>}
          </div>
        </section>
      )}

      {screen === "complete" && destination && (
        <section className="page page-center">
          <div className="check">OK</div>
          <h1>You have arrived</h1>
          <p className="lead">{destination.name}</p>
          <div className="stats">
            <div>
              <b>{route ? formatDistance(route.distanceMeters) : "—"}</b>
              <span>Planned walk</span>
            </div>
            <div>
              <b>
                {startedAt ? `${Math.max(1, Math.round((Date.now() - startedAt) / 60000))} min` : "—"}
              </b>
              <span>Time</span>
            </div>
          </div>
          <button
            className="btn"
            onClick={() => {
              setDestination(null);
              setRoute(null);
              setScreen("search");
            }}
          >
            Start new navigation
          </button>
          <button className="btn btn-ghost" onClick={() => setScreen("home")}>
            Back home
          </button>
        </section>
      )}
    </div>
  );
}
