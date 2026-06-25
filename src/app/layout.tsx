import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeScript } from "@/components/theme-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Préfixe de chemin pour les assets en production (GitHub Pages sous-chemin).
// next/image et les bundles _next sont préfixés automatiquement ; les icônes
// déclarées dans metadata doivent l'être explicitement.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Valiuz Measurement Studio — Mesure multi-levier",
  description:
    "POC de mesure multi-levier des campagnes retail media (on-site, off-site, in-store / DOOH) : incrémentalité exposés vs contrôle, iROAS, marketing mix modeling et assistant IA.",
  icons: {
    icon: `${basePath}/logo-valiuz.webp`,
    apple: `${basePath}/logo-valiuz.webp`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeScript defaultTheme="dark" enableSystem />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
