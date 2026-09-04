import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les routes.
 * Volontairement sans Content-Security-Policy stricte pour l'instant : une CSP
 * correcte doit lister explicitement Stripe (js.stripe.com, api.stripe.com) et
 * Supabase (*.supabase.co) sous peine de casser le checkout et les uploads.
 * → à ajouter dans une passe dédiée (WB1 #1.6, volet CSP).
 */
const securityHeaders = [
  // Force HTTPS pendant 2 ans, sous-domaines inclus.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Empêche le navigateur de « deviner » un type MIME (anti-sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Interdit l'affichage du site dans une iframe tierce (anti-clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Ne fuit pas l'URL complète vers les sites tiers.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Coupe les API navigateur sensibles non utilisées.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
