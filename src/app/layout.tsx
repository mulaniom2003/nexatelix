import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/lib/site";
import "./globals.css";

// Self-hosted fonts: no Google Fonts request, works offline and on any network.
const sans = localFont({
  src: "./fonts/onest.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});
const mono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  variable: "--font-mono",
  weight: "100 800",
  display: "swap",
});
const serif = localFont({
  src: [
    { path: "./fonts/fraunces.woff2", style: "normal" },
    { path: "./fonts/fraunces-italic.woff2", style: "italic" },
  ],
  variable: "--font-serif",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — RCS, SMS, WhatsApp & Telegram messaging`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    siteName: site.name,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
