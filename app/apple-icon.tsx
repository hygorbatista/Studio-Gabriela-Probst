import { ImageResponse } from "next/og";
import { loadBrandFonts, Monogram } from "@/lib/brand-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const fonts = await loadBrandFonts();

export default function AppleIcon() {
  return new ImageResponse(<Monogram size={size.width} />, {
    ...size,
    fonts: [...fonts],
  });
}
