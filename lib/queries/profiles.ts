import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type PublicProfile = Tables<"profiles">;

/**
 * Profil public d'un vendeur, résolu par son `username`.
 * `profiles` est lisible publiquement (RLS) ; `username` y est dénormalisé
 * depuis `users.username` (migration 004). Renvoie `null` si introuvable.
 */
export async function getProfileByUsername(username: string): Promise<PublicProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  return data;
}
