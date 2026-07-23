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

export type PublicProfileLite = Pick<Tables<"profiles">, "user_id" | "username" | "display_name" | "avatar_url">;

/** Profils publics indexés par user_id, pour résoudre des auteurs en lot. */
export async function getProfilesByUserIds(userIds: string[]): Promise<Map<string, PublicProfileLite>> {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, avatar_url")
    .in("user_id", ids);
  if (error) throw error;

  return new Map((data ?? []).map((p) => [p.user_id, p]));
}
