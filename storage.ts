const RECENT = "cv_recent";
const VOICE = "cv_voice";

export function getRecentIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT) || "[]");
  } catch {
    return [];
  }
}

export function pushRecent(id: string): void {
  const next = [id, ...getRecentIds().filter((x) => x !== id)].slice(0, 6);
  localStorage.setItem(RECENT, JSON.stringify(next));
}

export function getVoiceOn(): boolean {
  const v = localStorage.getItem(VOICE);
  return v !== "off";
}

export function setVoiceOn(on: boolean): void {
  localStorage.setItem(VOICE, on ? "on" : "off");
}
