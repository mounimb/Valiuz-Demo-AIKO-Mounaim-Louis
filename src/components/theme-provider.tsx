"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const MEDIA = "(prefers-color-scheme: dark)";

function getSystemTheme(): Resolved {
  return window.matchMedia(MEDIA).matches ? "dark" : "light";
}

function applyTheme(resolved: Resolved, disableTransition: boolean) {
  const el = document.documentElement;
  let restore: (() => void) | undefined;

  if (disableTransition) {
    const style = document.createElement("style");
    style.appendChild(
      document.createTextNode("*,*::before,*::after{transition:none !important}"),
    );
    document.head.appendChild(style);
    restore = () => {
      // Force a reflow so the disabled transitions are flushed, then restore.
      void window.getComputedStyle(document.body).transition;
      document.head.removeChild(style);
    };
  }

  el.classList.toggle("dark", resolved === "dark");
  el.style.colorScheme = resolved;
  restore?.();
}

interface ThemeProviderProps {
  children: ReactNode;
  /** Accepted for API compatibility; the `class` strategy is always used. */
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<Resolved>("light");
  const [mounted, setMounted] = useState(false);

  // Read the stored preference once on mount.
  useEffect(() => {
    setMounted(true);
    setSystemTheme(getSystemTheme());
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeState(stored);
      }
    } catch {
      // Ignore storage access errors (e.g. privacy mode).
    }
  }, [storageKey]);

  // Keep the resolved system theme in sync with the OS preference.
  useEffect(() => {
    if (!enableSystem) return;
    const mq = window.matchMedia(MEDIA);
    const onChange = () => setSystemTheme(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [enableSystem]);

  const resolvedTheme: Resolved =
    theme === "system" ? (enableSystem ? systemTheme : "light") : theme;

  // Reflect the resolved theme on <html> after mount (the inline ThemeScript
  // handles the very first paint to avoid a flash of the wrong theme).
  useEffect(() => {
    if (!mounted) return;
    applyTheme(resolvedTheme, disableTransitionOnChange);
  }, [resolvedTheme, mounted, disableTransitionOnChange]);

  const setTheme = useCallback(
    (next: Theme) => {
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Ignore storage access errors.
      }
      setThemeState(next);
    },
    [storageKey],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
