export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "trade-in-pro-theme";

export function resolveTheme(saved: string | null, prefersDark: boolean): Theme {
  if (saved === "light" || saved === "dark") return saved;
  return prefersDark ? "dark" : "light";
}