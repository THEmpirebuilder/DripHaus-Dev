"use client";

/**
 * Template racine : léger fondu d'entrée à chaque navigation (ressenti « vivant »),
 * désactivé si l'utilisateur préfère moins de mouvement (voir globals.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="dh-page-in">{children}</div>;
}
