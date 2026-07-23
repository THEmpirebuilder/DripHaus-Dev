import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Boutique = Tables<"boutiques">;

/** Membre de boutique enrichi de son profil public. */
export type BoutiqueMember = Tables<"boutique_members"> & {
  profile: Pick<Tables<"profiles">, "username" | "display_name" | "avatar_url"> | null;
};

/** Boutique par handle. RLS : visible si active, ou si l'appelant en est membre. */
export async function getBoutiqueByHandle(handle: string): Promise<Boutique | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boutiques")
    .select("*")
    .eq("handle", handle)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Membres d'une boutique, avec profil public. */
export async function getBoutiqueMembers(boutiqueId: string): Promise<BoutiqueMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boutique_members")
    .select("*, profile:profiles!inner(username, display_name, avatar_url)")
    .eq("boutique_id", boutiqueId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  // La jointure renvoie un tableau ; on prend le profil unique par user.
  return (data ?? []).map((m) => ({
    ...m,
    profile: Array.isArray(m.profile) ? m.profile[0] ?? null : m.profile,
  })) as BoutiqueMember[];
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
export async function getMyBoutiques(userId: string): Promise<Array<Boutique & { role: Tables<"boutique_members">["role"] }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boutique_members")
    .select("role, boutique:boutiques!inner(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const boutique = (Array.isArray(row.boutique) ? row.boutique[0] : row.boutique) as Boutique;
    return { ...boutique, role: row.role };
  });
}
