"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import type { TablesInsert } from "@/types/database";

export type ReviewFormState = { error?: string; success?: boolean };

/**
 * Laisse un avis à l'issue d'une transaction. La cible est déduite du rôle :
 * l'acheteur note le vendeur (user OU boutique), le vendeur note l'acheteur.
 * RLS : reviewer = uid ET partie prenante ; unique (transaction, reviewer).
 */
export async function createReviewAction(
  _prev: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const transactionId = String(formData.get("transaction_id") ?? "");
  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim() || null;

  if (!transactionId) return { error: "Transaction introuvable." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Note invalide (1 à 5)." };
  }

  const { data: tx } = await supabase
    .from("transactions")
    .select("buyer_user_id, seller_user_id, seller_boutique_id")
    .eq("id", transactionId)
    .maybeSingle();
  if (!tx) return { error: "Transaction introuvable." };

  // Cible = l'autre partie.
  let target: Pick<TablesInsert<"reviews">, "reviewed_user_id" | "reviewed_boutique_id">;
  if (user.authId === tx.buyer_user_id) {
    target = tx.seller_user_id
      ? { reviewed_user_id: tx.seller_user_id, reviewed_boutique_id: null }
      : { reviewed_user_id: null, reviewed_boutique_id: tx.seller_boutique_id };
  } else {
    target = { reviewed_user_id: tx.buyer_user_id, reviewed_boutique_id: null };
  }

  const { error } = await supabase.from("reviews").insert({
    transaction_id: transactionId,
    reviewer_user_id: user.authId,
    rating,
    comment,
    ...target,
  });

  if (error) {
    if (error.code === "23505") return { error: "Tu as déjà laissé un avis pour cette commande." };
    return { error: error.message };
  }

  revalidatePath(`/orders/${transactionId}`);
  return { success: true };
}
