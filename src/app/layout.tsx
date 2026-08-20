import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Montserrat } from "next/font/google";
import { eventConfig } from "@/config/event";
import CustomCursor from "@/components/CustomCursor";
import Preloader from "@/components/Preloader";
import "./globals.css";

const display = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://b2-b-photos.vercel.app";
const title = `${eventConfig.name} — Fotos oficiais`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description: eventConfig.description,
  openGraph: {
    title,
    description: eventConfig.description,
    url: siteUrl,
    siteName: eventConfig.brand,
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#04060e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${mono.variable}`}>
      <body className="grain cursor-none-desktop bg-ink font-[family-name:var(--font-display)] antialiased">
        <Preloader />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
