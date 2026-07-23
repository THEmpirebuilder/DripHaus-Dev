import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

/**
 * Utilisateur connecté, agrégé depuis trois sources :
 * - `auth.users` (identité Supabase, e-mail vérifié),
 * - `public.users` (rôle, statut, KYC — lisible par son seul propriétaire),
 * - `public.profiles` (identité publique : username, display_name, avatar…).
 */
export type SessionUser = {
  authId: string;
  email: string;
  account: Tables<"users">;
  profile: Tables<"profiles">;
};

/**
 * Lit l'utilisateur courant. `cache()` déduplique les appels au sein d'un même
 * rendu (header + page peuvent l'appeler sans requête réseau supplémentaire).
 * Renvoie `null` si non connecté.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: account }, { data: profile }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
  ]);

  // Fenêtre rare : session valide mais trigger de provisionnement pas encore joué.
  if (!account || !profile) return null;

  return { authId: user.id, email: user.email ?? account.email, account, profile };
});

/** Exige une session ; redirige vers /login sinon. À utiliser dans les pages protégées. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
