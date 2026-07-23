import { createClient } from "@/lib/supabase/server";
import { getProfilesByUserIds } from "@/lib/queries/profiles";
import { getBoutiquesByIds } from "@/lib/queries/boutiques";
import type { Tables } from "@/types/database";
import type { SellerRef } from "@/lib/queries/articles";

export type ArticleForTx = Pick<Tables<"articles">, "id" | "title" | "images" | "currency"> | null;

export type TransactionRow = Tables<"transactions"> & { article: ArticleForTx };

export type TransactionDetail = TransactionRow & {
  buyer: SellerRef | null;
  seller: SellerRef | null;
  dispute: Tables<"disputes"> | null;
};

const TX_SELECT = "*, article:articles(id, title, images, currency)";

/** Achats de l'utilisateur (en tant qu'acheteur). */
export async function getMyPurchases(userId: string): Promise<TransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(TX_SELECT)
    .eq("buyer_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TransactionRow[];
}

/** Ventes personnelles de l'utilisateur (vendeur = user). */
export async function getMySales(userId: string): Promise<TransactionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(TX_SELECT)
    .eq("seller_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TransactionRow[];
}

async function resolveParty(userId: string | null, boutiqueId: string | null): Promise<SellerRef | null> {
  if (userId) {
    const p = (await getProfilesByUserIds([userId])).get(userId);
    return p
      ? { kind: "user", name: p.display_name ?? p.username ?? "Utilisateur", href: p.username ? `/u/${p.username}` : "#", avatarUrl: p.avatar_url }
      : null;
  }
  if (boutiqueId) {
    const b = (await getBoutiquesByIds([boutiqueId])).get(boutiqueId);
    return b ? { kind: "boutique", name: b.name, href: `/boutique/${b.handle}`, avatarUrl: b.logo_url } : null;
  }
  return null;
}

/** Transaction complète : article, parties, litige éventuel. RLS = parties seulement. */
export async function getTransactionById(id: string): Promise<TransactionDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("transactions").select(TX_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const tx = data as TransactionRow;
  const [buyer, seller, dispute] = await Promise.all([
    resolveParty(tx.buyer_user_id, null),
    resolveParty(tx.seller_user_id, tx.seller_boutique_id),
    supabase.from("disputes").select("*").eq("transaction_id", id).maybeSingle().then((r) => r.data),
  ]);

  return { ...tx, buyer, seller, dispute };
}
