import type { Metadata } from "next";
import { Syne, Italiana, Italianno } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

/* Charte : Syne (interface/corps), Italiana (wordmark & titres), Italianno (monogramme). */
const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-syne",
  display: "swap",
});
const italiana = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italiana",
  display: "swap",
});
const italianno = Italianno({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italianno",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://driphaus.ch"),
  title: {
    default: "DripHaus — la mode indépendante suisse",
    template: "%s · DripHaus",
  },
  description:
    "Marketplace, feed et enchères dédiés à la mode indépendante suisse : seconde main, vintage, créateurs et boutiques multimarques.",
  openGraph: {
    type: "website",
    siteName: "DripHaus",
    locale: "fr_CH",
    title: "DripHaus — la mode indépendante suisse",
    description:
      "La mode indépendante suisse : seconde main, vintage, créateurs et boutiques, authentifiés pièce par pièce.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${italiana.variable} ${italianno.variable}`}>
      <body className="antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
