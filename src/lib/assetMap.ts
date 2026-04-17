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

const fashionImages = import.meta.glob("../assets/fashions/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const fashionMap = Object.fromEntries(
  Object.entries(fashionImages).map(([path, url]) => [
    `/src/assets/fashions/${path.split("/").pop()}`,
    url,
  ]),
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
  ...fashionMap,
};

export function resolveImage(src: string | null | undefined): string {
  if (!src) return suits;
  if (map[src]) return map[src];
  return src;
}
