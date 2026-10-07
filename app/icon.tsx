import { ImageResponse } from "next/og";
import { loadBrandFonts, Monogram } from "@/lib/brand-image";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

const fonts = await loadBrandFonts();

export default function Icon() {
  return new ImageResponse(<Monogram size={size.width} />, {
    ...size,
    fonts: [...fonts],
  });
}
