import { createClient } from "@/lib/supabase/server";
import { getProfilesByUserIds } from "@/lib/queries/profiles";
import type { Tables } from "@/types/database";
import type { PostAuthor } from "@/lib/queries/posts";

export type ReviewTarget = { userId?: string; boutiqueId?: string };

export type ReviewWithAuthor = Tables<"reviews"> & { reviewer: PostAuthor | null };

export type RatingSummary = { average: number; count: number };

/** Avis reçus par une cible (user OU boutique), avec l'auteur résolu. */
export async function getReviewsAbout(target: ReviewTarget): Promise<ReviewWithAuthor[]> {
  const supabase = await createClient();
  let query = supabase.from("reviews").select("*").order("created_at", { ascending: false });

  if (target.userId) query = query.eq("reviewed_user_id", target.userId);
  else if (target.boutiqueId) query = query.eq("reviewed_boutique_id", target.boutiqueId);
  else return [];

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const profiles = await getProfilesByUserIds(rows.map((r) => r.reviewer_user_id));

  return rows.map((r) => {
    const p = profiles.get(r.reviewer_user_id);
    return {
      ...r,
      reviewer: p
        ? {
            kind: "user",
            name: p.display_name ?? p.username ?? "Utilisateur",
            href: p.username ? `/u/${p.username}` : "#",
            avatarUrl: p.avatar_url,
          }
        : null,
    };
  });
}

/** Note moyenne + nombre d'avis d'une cible. */
export async function getRatingSummary(target: ReviewTarget): Promise<RatingSummary> {
  const reviews = await getReviewsAbout(target);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
}

/** Avis déjà laissé par `reviewerId` sur une transaction (ou null). */
export async function getMyReviewForTransaction(
  transactionId: string,
  reviewerId: string
): Promise<Tables<"reviews"> | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("transaction_id", transactionId)
    .eq("reviewer_user_id", reviewerId)
    .maybeSingle();
  return data ?? null;
}
