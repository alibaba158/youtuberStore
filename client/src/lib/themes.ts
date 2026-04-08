export type ThemeType = "default" | "green-gold" | "red-cream" | "teal-brown" | "pink-gray";

export interface ThemeConfig {
  name: string;
  label: string;
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
}

export const themes: Record<ThemeType, ThemeConfig> = {
  default: {
    name: "default",
    label: "צהוב וירוק",
    primary: "oklch(0.80 0.20 85)",
    accent: "oklch(0.38 0.14 145)",
    background: "oklch(0.98 0.004 85)",
    foreground: "oklch(0.18 0.01 145)",
    muted: "oklch(0.95 0.006 85)",
    mutedForeground: "oklch(0.52 0.015 145)",
  },
  "green-gold": {
    name: "green-gold",
    label: "ירוק וזהב",
    primary: "oklch(0.25 0.08 145)",
    accent: "oklch(0.52 0.11 85)",
    background: "oklch(0.98 0.004 85)",
    foreground: "oklch(0.18 0.01 145)",
    muted: "oklch(0.95 0.006 85)",
    mutedForeground: "oklch(0.52 0.015 145)",
  },
  "red-cream": {
    name: "red-cream",
    label: "אדום וקרם",
    primary: "oklch(0.35 0.15 25)",
    accent: "oklch(0.58 0.12 35)",
    background: "oklch(0.99 0.002 85)",
    foreground: "oklch(0.20 0.01 25)",
    muted: "oklch(0.96 0.006 85)",
    mutedForeground: "oklch(0.55 0.015 25)",
  },
  "teal-brown": {
    name: "teal-brown",
    label: "טורקיז וחום",
    primary: "oklch(0.35 0.12 200)",
    accent: "oklch(0.46 0.09 60)",
    background: "oklch(0.98 0.004 85)",
    foreground: "oklch(0.20 0.01 200)",
    muted: "oklch(0.95 0.006 85)",
    mutedForeground: "oklch(0.52 0.015 200)",
  },
  "pink-gray": {
    name: "pink-gray",
    label: "ורוד ואפור",
    primary: "oklch(0.45 0.12 320)",
    accent: "oklch(0.48 0.11 350)",
    background: "oklch(0.98 0.004 85)",
    foreground: "oklch(0.20 0.01 320)",
    muted: "oklch(0.95 0.006 85)",
    mutedForeground: "oklch(0.55 0.015 320)",
  },
};

export function applyTheme(theme: ThemeType) {
  const config = themes[theme];
  const root = document.documentElement;

  root.style.setProperty("--primary", config.primary);
  root.style.setProperty("--accent", config.accent);
  root.style.setProperty("--background", config.background);
  root.style.setProperty("--foreground", config.foreground);
  root.style.setProperty("--muted", config.muted);
  root.style.setProperty("--muted-foreground", config.mutedForeground);

  localStorage.setItem("theme", theme);
}

export function getStoredTheme(): ThemeType {
  const stored = localStorage.getItem("theme");
  if (stored && stored in themes) {
    return stored as ThemeType;
  }
  return "default";
}

export function initializeTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
}
