import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void } | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, updateTheme] = useState<Theme>("light");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let saved: string | null = null;
      try { saved = window.localStorage.getItem(THEME_STORAGE_KEY); } catch { /* Storage may be blocked. */ }
      updateTheme(resolveTheme(saved, media.matches));
    };
    sync();
    media.addEventListener("change", sync);
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  function setTheme(next: Theme) {
    updateTheme(next);
    try { window.localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* Still switch for this visit. */ }
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function ThemeControls() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex h-12 shrink-0 items-center justify-end border-b border-border/70 bg-background px-5 print:hidden">
      <div role="group" aria-label="Apparence" className="flex items-center gap-1">
        <Button variant={theme === "light" ? "secondary" : "ghost"} size="icon" aria-label="Mode clair" title="Mode clair" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
          <Sun aria-hidden="true" />
        </Button>
        <Button variant={theme === "dark" ? "secondary" : "ghost"} size="icon" aria-label="Mode sombre" title="Mode sombre" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
          <Moon aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}