import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DripHaus — la plateforme suisse de la mode indépendante",
    template: "%s · DripHaus",
  },
  description:
    "Marketplace, feed et enchères dédiés à la mode indépendante suisse : seconde main, vintage, créateurs et boutiques multimarques.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
