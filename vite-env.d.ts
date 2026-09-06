/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
}

declare global {
  interface Window {
    L: typeof import("leaflet");
  }
}

export {};
