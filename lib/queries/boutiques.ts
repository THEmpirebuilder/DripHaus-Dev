import { createClient } from "@/lib/supabase/server";
import { getProfilesByUserIds } from "@/lib/queries/profiles";
import type { Tables } from "@/types/database";

/**
 * Boutique sans les colonnes sensibles (`stripe_account_id`, `siret_ide`),
 * masquées aux rôles anon/authenticated par la migration 008 : ces champs ne
 * sont accessibles qu'en service_role (webhook Stripe / checkout).
 */
export type BoutiquePublic = Omit<Tables<"boutiques">, "stripe_account_id" | "siret_ide">;
export type Boutique = BoutiquePublic;

/** Colonnes boutiques lisibles par les rôles publics (cf. migration 008). */
const BOUTIQUE_PUBLIC_COLUMNS =
  "id, handle, name, description, logo_url, cover_url, address, phone, email_contact, website_url, social_links, business_hours, kyc_verified, subscription_tier, status, created_at, updated_at";

/** Membre de boutique enrichi de son profil public. */
export type BoutiqueMember = Tables<"boutique_members"> & {
  profile: Pick<Tables<"profiles">, "username" | "display_name" | "avatar_url"> | null;
};

/** Boutique par handle. RLS : visible si active, ou si l'appelant en est membre. */
export async function getBoutiqueByHandle(handle: string): Promise<BoutiquePublic | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boutiques")
    .select(BOUTIQUE_PUBLIC_COLUMNS)
    .eq("handle", handle)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Membres d'une boutique, avec profil public.
 * `boutique_members` et `profiles` n'ont PAS de FK directe (liées via `users`) →
 * l'embedding PostgREST `profiles!inner` échoue (PGRST200). On résout donc les
 * profils en 2 temps (même pattern que `reviews.ts`).
 */
export async function getBoutiqueMembers(boutiqueId: string): Promise<BoutiqueMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boutique_members")
    .select("*")
    .eq("boutique_id", boutiqueId)
    .order("joined_at", { ascending: true });
  if (error) throw error;

  const rows = data ?? [];
  const profiles = await getProfilesByUserIds(rows.map((m) => m.user_id));
  return rows.map((m) => {
    const p = profiles.get(m.user_id);
    return {
      ...m,
      profile: p ? { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url } : null,
    };
  });
}

export type BoutiqueLite = Pick<Tables<"boutiques">, "id" | "name" | "handle" | "logo_url">;

/** Boutiques (identité publique) indexées par id, pour résoudre des auteurs en lot. */
export async function getBoutiquesByIds(ids: string[]): Promise<Map<string, BoutiqueLite>> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boutiques")
    .select("id, name, handle, logo_url")
    .in("id", unique);
  if (error) throw error;

  return new Map((data ?? []).map((b) => [b.id, b]));
}

/** Boutiques dont l'utilisateur est membre (owner ou manager). */
export async function getMyBoutiques(userId: string): Promise<Array<BoutiquePublic & { role: Tables<"boutique_members">["role"] }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boutique_members")
    .select(`role, boutique:boutiques!inner(${BOUTIQUE_PUBLIC_COLUMNS})`)
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const boutique = (Array.isArray(row.boutique) ? row.boutique[0] : row.boutique) as BoutiquePublic;
    return { ...boutique, role: row.role };
  });
}
