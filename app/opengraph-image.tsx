import { ImageResponse } from "next/og";
import { loadBrandFonts, ShareCard } from "@/lib/brand-image";

export const alt = "Gabriela Probst · Nail Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fonts = await loadBrandFonts();

export default function OpengraphImage() {
  return new ImageResponse(<ShareCard />, {
    ...size,
    fonts: [...fonts],
  });
}
