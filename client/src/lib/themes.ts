export type ThemeType = "default" | "slate-blue" | "emerald-slate" | "rose-slate" | "violet-slate";

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
    label: "כחול סלייט",
    primary: "oklch(0.45 0.08 260)",
    accent: "oklch(0.65 0.18 200)",
    background: "oklch(0.985 0.003 250)",
    foreground: "oklch(0.20 0.02 260)",
    muted: "oklch(0.96 0.006 250)",
    mutedForeground: "oklch(0.50 0.02 260)",
  },
  "slate-blue": {
    name: "slate-blue",
    label: "כחול עמוק",
    primary: "oklch(0.35 0.10 265)",
    accent: "oklch(0.70 0.15 210)",
    background: "oklch(0.99 0.002 250)",
    foreground: "oklch(0.18 0.015 265)",
    muted: "oklch(0.97 0.004 250)",
    mutedForeground: "oklch(0.48 0.015 265)",
  },
  "emerald-slate": {
    name: "emerald-slate",
    label: "ירוק אמרלד",
    primary: "oklch(0.38 0.09 160)",
    accent: "oklch(0.68 0.14 150)",
    background: "oklch(0.985 0.003 150)",
    foreground: "oklch(0.20 0.015 160)",
    muted: "oklch(0.96 0.005 150)",
    mutedForeground: "oklch(0.50 0.015 160)",
  },
  "rose-slate": {
    name: "rose-slate",
    label: "ורוד עדין",
    primary: "oklch(0.42 0.10 340)",
    accent: "oklch(0.72 0.12 330)",
    background: "oklch(0.99 0.002 340)",
    foreground: "oklch(0.20 0.015 340)",
    muted: "oklch(0.97 0.004 340)",
    mutedForeground: "oklch(0.48 0.015 340)",
  },
  "violet-slate": {
    name: "violet-slate",
    label: "סגול מלכותי",
    primary: "oklch(0.40 0.12 280)",
    accent: "oklch(0.68 0.16 270)",
    background: "oklch(0.985 0.003 280)",
    foreground: "oklch(0.18 0.015 280)",
    muted: "oklch(0.96 0.005 280)",
    mutedForeground: "oklch(0.50 0.015 280)",
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
