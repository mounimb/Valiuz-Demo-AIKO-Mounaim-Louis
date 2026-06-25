import type { NextConfig } from "next";

// En production sur GitHub Pages, le site est servi sous un sous-chemin
// (https://<user>.github.io/<repo>/). Le workflow CI fournit ce préfixe via
// NEXT_PUBLIC_BASE_PATH ; en local (`next dev`) la variable est absente et le
// site reste servi à la racine.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Export statique : génère un dossier `out/` (HTML/CSS/JS) déployable sur
  // n'importe quel hébergeur statique, dont GitHub Pages.
  output: "export",
  basePath,
  // next/image ne peut pas utiliser le loader par défaut en export statique.
  images: { unoptimized: true },
  // GitHub Pages sert /route comme /route/ — trailingSlash évite les 404.
  trailingSlash: true,
};

export default nextConfig;
