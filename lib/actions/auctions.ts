"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

export type AuctionFormState = { error?: string };
export type BidFormState = { error?: string; success?: boolean };

const DURATIONS = new Set([1, 3, 5, 7, 14]);

/**
 * Crée une enchère sur un article possédé (RLS owns_article), passe l'article
 * en `is_auction`, et publie automatiquement un post dans le feed.
 */
export async function createAuctionAction(
  _prev: AuctionFormState,
  formData: FormData
): Promise<AuctionFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const articleId = String(formData.get("article_id") ?? "");
  const startingPrice = Number(formData.get("starting_price"));
  const bidIncrement = Number(formData.get("bid_increment") || 1);
  const reserveRaw = String(formData.get("reserve_price") ?? "").trim();
  const reservePrice = reserveRaw ? Number(reserveRaw) : null;
  const durationDays = Number(formData.get("duration_days") || 7);

  if (!articleId) return { error: "Article introuvable." };
  if (!Number.isFinite(startingPrice) || startingPrice <= 0) {
    return { error: "Le prix de départ doit être positif." };
  }
  if (!Number.isFinite(bidIncrement) || bidIncrement <= 0) {
    return { error: "L'incrément doit être positif." };
  }
  if (reservePrice !== null && (!Number.isFinite(reservePrice) || reservePrice < startingPrice)) {
    return { error: "Le prix de réserve doit être ≥ au prix de départ." };
  }
  if (!DURATIONS.has(durationDays)) return { error: "Durée invalide." };

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const auctionId = randomUUID();

  const { error: auctionError } = await supabase.from("auctions").insert({
    id: auctionId,
    article_id: articleId,
    seller_user_id: user.authId,
    starting_price: startingPrice,
    bid_increment: bidIncrement,
    reserve_price: reservePrice,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "active",
  });

  if (auctionError) {
    if (auctionError.code === "23505") return { error: "Cet article est déjà aux enchères." };
    return { error: auctionError.message };
  }

  // Marque l'article et publie l'annonce dans le feed (best-effort).
  await supabase.from("articles").update({ is_auction: true }).eq("id", articleId);
  await supabase.from("posts").insert({
    author_user_id: user.authId,
    auction_id: auctionId,
    article_id: articleId,
    type: "auction",
    content: "Nouvelle enchère en ligne 🔨",
    status: "published",
  });

  revalidatePath("/auctions");
  redirect(`/auction/${auctionId}`);
}

/** Pose une offre. La RLS vérifie la fenêtre active et que l'enchérisseur n'est pas le vendeur. */
export async function placeBidAction(
  _prev: BidFormState,
  formData: FormData
): Promise<BidFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const auctionId = String(formData.get("auction_id") ?? "");
  const amount = Number(formData.get("amount"));
  if (!auctionId) return { error: "Enchère introuvable." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Montant invalide." };

  const { data: auction } = await supabase
    .from("auctions")
    .select("starting_price, bid_increment, ends_at, status, seller_user_id")
    .eq("id", auctionId)
    .maybeSingle();

  if (!auction) return { error: "Enchère introuvable." };
  if (auction.status !== "active" || new Date(auction.ends_at) <= new Date()) {
    return { error: "Cette enchère est terminée." };
  }
  if (auction.seller_user_id === user.authId) {
    return { error: "Tu ne peux pas enchérir sur ta propre vente." };
  }

  const { data: top } = await supabase
    .from("auction_bids")
    .select("amount")
    .eq("auction_id", auctionId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  const highest = top ? Number(top.amount) : null;
  const minNext = highest !== null ? highest + Number(auction.bid_increment) : Number(auction.starting_price);

  if (amount < minNext) {
    return { error: `Offre trop basse : mise au moins ${minNext.toFixed(2)} CHF.` };
  }

  const { error } = await supabase.from("auction_bids").insert({
    auction_id: auctionId,
    bidder_user_id: user.authId,
    amount,
  });

  if (error) {
    if (error.code === "23505") return { error: "Quelqu'un vient de miser ce montant. Réessaie plus haut." };
    return { error: error.message };
  }

  revalidatePath(`/auction/${auctionId}`);
  return { success: true };
}
