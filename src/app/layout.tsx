import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { eventConfig } from "@/config/event";
import CustomCursor from "@/components/CustomCursor";
import Preloader from "@/components/Preloader";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://conexoesb2b.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Conexões B2B — Os momentos que conectaram negócios",
  description: eventConfig.description,
  openGraph: {
    title: "Conexões B2B — Os momentos que conectaram negócios",
    description: eventConfig.description,
    url: siteUrl,
    siteName: eventConfig.name,
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#050509",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${mono.variable}`}>
      <body className="cursor-none-desktop bg-ink font-[family-name:var(--font-space)] antialiased">
        <Preloader />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
