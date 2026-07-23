import { createClient } from "@/lib/supabase/server";

export type FollowTarget = { userId?: string; boutiqueId?: string };

/** Indique si `followerId` suit la cible (user OU boutique). */
export async function isFollowing(followerId: string, target: FollowTarget): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from("follows").select("id").eq("follower_user_id", followerId);

  if (target.userId) query = query.eq("followed_user_id", target.userId);
  else if (target.boutiqueId) query = query.eq("followed_boutique_id", target.boutiqueId);
  else return false;

  const { data } = await query.maybeSingle();
  return Boolean(data);
}

/** Nombre d'abonnés d'une cible. */
export async function getFollowerCount(target: FollowTarget): Promise<number> {
  const supabase = await createClient();
  let query = supabase.from("follows").select("*", { count: "exact", head: true });

  if (target.userId) query = query.eq("followed_user_id", target.userId);
  else if (target.boutiqueId) query = query.eq("followed_boutique_id", target.boutiqueId);
  else return 0;

  const { count } = await query;
  return count ?? 0;
}
