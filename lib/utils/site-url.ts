import { headers } from "next/headers";

/**
 * URL absolue du site, pour construire les liens de redirection e-mail (Supabase).
 * Priorité à NEXT_PUBLIC_SITE_URL, sinon déduite des en-têtes de la requête.
 */
export async function getSiteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
