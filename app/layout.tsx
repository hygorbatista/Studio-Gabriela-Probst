import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { MotionProvider } from "@/components/motion";
import { StructuredData } from "@/components/structured-data";
import {
  localBusinessJsonLd,
  seoDescription,
  seoTitle,
  siteUrl,
} from "@/lib/seo";
import { site } from "@/lib/site";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: seoTitle, template: `%s | ${site.name}` },
  description: seoDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: seoTitle,
    description: seoDescription,
    url: "/",
    siteName: site.name,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description: seoDescription,
  },
};

// Pinta a barra do navegador no celular com o preto do hero.
export const viewport: Viewport = {
  themeColor: "#0b0b0c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${playfair.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col">
        <StructuredData data={localBusinessJsonLd} />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
