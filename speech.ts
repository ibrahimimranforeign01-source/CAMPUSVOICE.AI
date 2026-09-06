export function speak(text: string): void {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.pitch = 1;
  u.lang = "en-NG";
  window.speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function voiceAvailable(): boolean {
  return "speechSynthesis" in window;
}
