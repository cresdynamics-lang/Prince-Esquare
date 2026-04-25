// Maps `/src/assets/*.jpg` strings stored in the database (seed data) to
// real ES6 image imports so Vite bundles and optimizes them.

import suits from "@/assets/cat-suits.jpg";
import shirts from "@/assets/cat-shirts.jpg";
import trousers from "@/assets/cat-trousers.jpg";
import shoes from "@/assets/cat-shoes.jpg";
import socks from "@/assets/cat-socks.jpg";
import belts from "@/assets/cat-belts.jpg";
import casual from "@/assets/cat-casual.jpg";
import formal from "@/assets/cat-formal.jpg";
import sportswear from "@/assets/cat-sportswear.jpg";
import heroSuit from "@/assets/hero-suit.jpg";

const fashionImages = import.meta.glob("../assets/fashions/*.{jpg,jpeg,png,webp,avif,jfif}", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const catalogImages = import.meta.glob("../assets/catalog/*/*.{jpg,jpeg,png,webp,avif,jfif}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const fashionMap = Object.fromEntries(
  Object.entries(fashionImages).map(([path, url]) => [
    `/src/assets/fashions/${path.split("/").pop()}`,
    url,
  ]),
);
const catalogMap = Object.fromEntries(
  Object.entries(catalogImages).map(([path, url]) => {
    const normalized = path.replace(/\\/g, "/");
    const [category, file] = normalized.split("/").slice(-2);
    return [`/src/assets/catalog/${category}/${file}`, url];
  }),
);

const map: Record<string, string> = {
  "/src/assets/cat-suits.jpg": suits,
  "/src/assets/cat-shirts.jpg": shirts,
  "/src/assets/cat-trousers.jpg": trousers,
  "/src/assets/cat-shoes.jpg": shoes,
  "/src/assets/cat-socks.jpg": socks,
  "/src/assets/cat-belts.jpg": belts,
  "/src/assets/cat-casual.jpg": casual,
  "/src/assets/cat-formal.jpg": formal,
  "/src/assets/cat-sportswear.jpg": sportswear,
  "/src/assets/hero-suit.jpg": heroSuit,
  ...fashionMap,
  ...catalogMap,
};

function toOptimizedVariants(src: string): string[] {
  const avif = src.replace(/\.(jpg|jpeg|png|jfif)$/i, ".avif");
  const webp = src.replace(/\.(jpg|jpeg|png|jfif)$/i, ".webp");
  return [avif, webp];
}

export function resolveImage(src: string | null | undefined): string {
  if (!src) return suits;
  const [avifKey, webpKey] = toOptimizedVariants(src);
  if (map[avifKey]) return map[avifKey];
  if (map[webpKey]) return map[webpKey];
  if (map[src]) return map[src];
  if (avifKey !== src) return avifKey;
  if (webpKey !== src) return webpKey;
  return src;
}
