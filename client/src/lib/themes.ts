export type ThemeType = "default";

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
    label: "ורוד וסגול",
    primary: "oklch(0.50 0.20 330)",
    accent: "oklch(0.62 0.18 340)",
    background: "oklch(0.98 0.004 330)",
    foreground: "oklch(0.18 0.01 330)",
    muted: "oklch(0.95 0.006 330)",
    mutedForeground: "oklch(0.52 0.015 330)",
  },
};

export function applyTheme(_theme: ThemeType = "default") {
  const config = themes.default;
  const root = document.documentElement;

  root.style.setProperty("--primary", config.primary);
  root.style.setProperty("--accent", config.accent);
  root.style.setProperty("--background", config.background);
  root.style.setProperty("--foreground", config.foreground);
  root.style.setProperty("--muted", config.muted);
  root.style.setProperty("--muted-foreground", config.mutedForeground);

  localStorage.setItem("theme", "default");
}

export function getStoredTheme(): ThemeType {
  return "default";
}

export function initializeTheme() {
  applyTheme("default");
}
