import Image from "next/image";

// Asset détouré (wordmark seul, sans tagline) — ratio largeur/hauteur ≈ 3.15.
const ASSET_W = 536;
const ASSET_H = 170;

// Hauteur (px) du wordmark selon la taille.
const HEIGHTS = {
  sm: 15,
  md: 19,
  lg: 26,
} as const;

/**
 * Marque Valiuz. Le wordmark est posé sur une pastille blanche arrondie pour
 * rester lisible en thèmes sombre comme clair (le logo est en encre foncée).
 */
export function ValiuzLogo({
  size = "md",
  priority = false,
  className = "",
}: {
  size?: keyof typeof HEIGHTS;
  priority?: boolean;
  className?: string;
}) {
  const h = HEIGHTS[size];
  const w = Math.round((h * ASSET_W) / ASSET_H);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md bg-white px-2 py-1 shadow-sm ${className}`}
    >
      <Image
        src="/logo-valiuz-wordmark.png"
        alt="Valiuz"
        width={ASSET_W}
        height={ASSET_H}
        priority={priority}
        style={{ height: h, width: w }}
        className="object-contain"
      />
    </span>
  );
}
