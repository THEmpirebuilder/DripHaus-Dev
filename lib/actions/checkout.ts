"use server";

import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { createEscrowPaymentIntent } from "@/lib/stripe/connect";
import { platformFee, toMinorUnits } from "@/lib/stripe/client";

export type CheckoutResult = {
  error?: string;
  clientSecret?: string;
  transactionId?: string;
};

/**
 * Démarre un achat : crée la ligne `transactions` (statut `pending`, seule
 * écriture autorisée au client) puis un PaymentIntent en escrow. Le webhook
 * Stripe fera évoluer les statuts (held → payout) — jamais le client.
 */
export async function startCheckout(articleId: string): Promise<CheckoutResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("id, price, currency, status, seller_user_id, seller_boutique_id")
    .eq("id", articleId)
    .maybeSingle();

  if (!article) return { error: "Article introuvable." };
  if (article.status !== "active") return { error: "Cet article n'est plus disponible." };
  if (article.seller_user_id === user.authId) {
    return { error: "Tu ne peux pas acheter ton propre article." };
  }

  const amount = Number(article.price);
  const feeChf = platformFee(toMinorUnits(amount)) / 100;
  const transactionId = randomUUID();

  const { error: txError } = await supabase.from("transactions").insert({
    id: transactionId,
    buyer_user_id: user.authId,
    seller_user_id: article.seller_user_id,
    seller_boutique_id: article.seller_boutique_id,
    article_id: article.id,
    amount,
    platform_fee: feeChf,
    currency: article.currency,
    payment_status: "pending",
    payout_status: "pending",
  });

  if (txError) return { error: txError.message };

  // Compte vendeur : lisible pour une boutique active ; pour un vendeur
  // particulier, la RLS le masque à l'acheteur — le payout (webhook,
  // service_role) le résoudra depuis la transaction.
  let sellerAccountId = "";
  if (article.seller_boutique_id) {
    const { data: boutique } = await supabase
      .from("boutiques")
      .select("stripe_account_id")
      .eq("id", article.seller_boutique_id)
      .maybeSingle();
    sellerAccountId = boutique?.stripe_account_id ?? "";
  }

  try {
    const pi = await createEscrowPaymentIntent({
      amountChf: amount,
      transactionId,
      buyerUserId: user.authId,
      sellerAccountId,
    });
    return { clientSecret: pi.client_secret ?? undefined, transactionId };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur lors de l'initialisation du paiement." };
  }
}
