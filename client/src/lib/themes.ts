export type ThemeType = "default" | "midnight-blue" | "forest-green" | "burgundy" | "ocean-teal" | "warm-sand";

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

// Professional e-commerce color palettes based on conversion rates and trust psychology
export const themes: Record<ThemeType, ThemeConfig> = {
  default: {
    name: "default",
    label: "כחול לילה",
    primary: "oklch(0.38 0.09 265)",
    accent: "oklch(0.68 0.14 205)",
    background: "oklch(0.985 0.002 250)",
    foreground: "oklch(0.20 0.015 265)",
    muted: "oklch(0.965 0.004 250)",
    mutedForeground: "oklch(0.48 0.015 265)",
  },
  "midnight-blue": {
    name: "midnight-blue",
    label: "כחול מידנייט",
    primary: "oklch(0.32 0.08 270)",
    accent: "oklch(0.72 0.12 215)",
    background: "oklch(0.99 0.001 260)",
    foreground: "oklch(0.18 0.012 270)",
    muted: "oklch(0.97 0.003 260)",
    mutedForeground: "oklch(0.45 0.012 270)",
  },
  "forest-green": {
    name: "forest-green",
    label: "ירוק יער",
    primary: "oklch(0.35 0.08 155)",
    accent: "oklch(0.65 0.12 145)",
    background: "oklch(0.985 0.003 150)",
    foreground: "oklch(0.19 0.013 155)",
    muted: "oklch(0.965 0.005 150)",
    mutedForeground: "oklch(0.46 0.013 155)",
  },
  burgundy: {
    name: "burgundy",
    label: "בורדו יוקרתי",
    primary: "oklch(0.38 0.10 350)",
    accent: "oklch(0.70 0.11 345)",
    background: "oklch(0.99 0.002 340)",
    foreground: "oklch(0.20 0.014 350)",
    muted: "oklch(0.97 0.004 340)",
    mutedForeground: "oklch(0.47 0.014 350)",
  },
  "ocean-teal": {
    name: "ocean-teal",
    label: "טורקיז אוקיינוס",
    primary: "oklch(0.40 0.09 195)",
    accent: "oklch(0.70 0.13 185)",
    background: "oklch(0.985 0.002 190)",
    foreground: "oklch(0.19 0.012 195)",
    muted: "oklch(0.965 0.004 190)",
    mutedForeground: "oklch(0.46 0.012 195)",
  },
  "warm-sand": {
    name: "warm-sand",
    label: "חום חולי",
    primary: "oklch(0.42 0.08 70)",
    accent: "oklch(0.68 0.10 65)",
    background: "oklch(0.985 0.003 85)",
    foreground: "oklch(0.22 0.014 70)",
    muted: "oklch(0.965 0.005 85)",
    mutedForeground: "oklch(0.50 0.014 70)",
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
