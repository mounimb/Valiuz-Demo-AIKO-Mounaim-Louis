// Emits an inline script that sets the theme class on <html> before first
// paint, avoiding a flash of the wrong theme. We use next/script with
// `beforeInteractive` (the App Router pattern for inline pre-hydration scripts):
// it runs before any page hydration and avoids React's "script tag while
// rendering" warning that a raw <script> element triggers.

import Script from "next/script";

interface ThemeScriptProps {
  defaultTheme?: "light" | "dark" | "system";
  enableSystem?: boolean;
  storageKey?: string;
}

export function ThemeScript({
  defaultTheme = "system",
  enableSystem = true,
  storageKey = "theme",
}: ThemeScriptProps) {
  const js =
    `(function(){try{` +
    `var d=document.documentElement;` +
    `var pref=localStorage.getItem(${JSON.stringify(storageKey)})||${JSON.stringify(defaultTheme)};` +
    `var sys=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';` +
    `var t=pref==='system'?(${enableSystem ? "sys" : "'light'"}):pref;` +
    `d.classList.toggle('dark',t==='dark');` +
    `d.style.colorScheme=t;` +
    `}catch(e){}})();`;

  return (
    <Script
      id="theme-script"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{ __html: js }}
    />
  );
}
