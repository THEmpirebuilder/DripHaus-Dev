import { createClient } from "@/lib/supabase/server";
import { getProfilesByUserIds } from "@/lib/queries/profiles";
import { getBoutiquesByIds } from "@/lib/queries/boutiques";
import type { Tables } from "@/types/database";
import type { PostAuthor } from "@/lib/queries/posts";
import type { SellerRef } from "@/lib/queries/articles";

export type ArticleForAuction = Pick<
  Tables<"articles">,
  "id" | "title" | "images" | "currency"
> | null;

export type AuctionListItem = Tables<"auctions"> & {
  article: ArticleForAuction;
  highestBid: number | null;
  minNextBid: number;
};

export type AuctionBidRow = { amount: number; created_at: string; bidder: PostAuthor | null };

export type AuctionDetail = AuctionListItem & {
  seller: SellerRef | null;
  bidCount: number;
  bids: AuctionBidRow[];
};

const AUCTION_SELECT = "*, article:articles(id, title, images, currency)";

/** Prix minimum de la prochaine enchère. */
function minNext(auction: Tables<"auctions">, highest: number | null): number {
  return highest !== null ? highest + Number(auction.bid_increment) : Number(auction.starting_price);
}

/** Enchères visibles, les plus proches de la fin d'abord. */
export async function listAuctions(): Promise<AuctionListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("auctions")
    .select(AUCTION_SELECT)
    .in("status", ["active", "scheduled"])
    .order("ends_at", { ascending: true });
  if (error) throw error;

  const auctions = (data ?? []) as (Tables<"auctions"> & { article: ArticleForAuction })[];
  if (auctions.length === 0) return [];

  const { data: bids } = await supabase
    .from("auction_bids")
    .select("auction_id, amount")
    .in("auction_id", auctions.map((a) => a.id));

  const highest = new Map<string, number>();
  for (const b of bids ?? []) {
    highest.set(b.auction_id, Math.max(highest.get(b.auction_id) ?? 0, Number(b.amount)));
  }

  return auctions.map((a) => {
    const h = highest.get(a.id) ?? null;
    return { ...a, highestBid: h, minNextBid: minNext(a, h) };
  });
}

/** Enchère complète : article, vendeur, historique des offres. */
export async function getAuctionById(id: string): Promise<AuctionDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("auctions").select(AUCTION_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const auction = data as Tables<"auctions"> & { article: ArticleForAuction };

  const { data: bidRows } = await supabase
    .from("auction_bids")
    .select("amount, created_at, bidder_user_id")
    .eq("auction_id", id)
    .order("amount", { ascending: false });

  const rows = bidRows ?? [];
  const bidderProfiles = await getProfilesByUserIds(rows.map((b) => b.bidder_user_id));
  const bids: AuctionBidRow[] = rows.map((b) => {
    const prof = bidderProfiles.get(b.bidder_user_id);
    return {
      amount: Number(b.amount),
      created_at: b.created_at,
      bidder: prof
        ? {
            kind: "user",
            name: prof.display_name ?? prof.username ?? "Enchérisseur",
            href: prof.username ? `/u/${prof.username}` : "#",
            avatarUrl: prof.avatar_url,
          }
        : null,
    };
  });

  const highest = bids.length > 0 ? bids[0].amount : null;

  // Vendeur (XOR user/boutique).
  let seller: SellerRef | null = null;
  if (auction.seller_user_id) {
    const p = (await getProfilesByUserIds([auction.seller_user_id])).get(auction.seller_user_id);
    if (p) seller = { kind: "user", name: p.display_name ?? p.username ?? "Vendeur", href: p.username ? `/u/${p.username}` : "#", avatarUrl: p.avatar_url };
  } else if (auction.seller_boutique_id) {
    const b = (await getBoutiquesByIds([auction.seller_boutique_id])).get(auction.seller_boutique_id);
    if (b) seller = { kind: "boutique", name: b.name, href: `/boutique/${b.handle}`, avatarUrl: b.logo_url };
  }

  return {
    ...auction,
    highestBid: highest,
    minNextBid: minNext(auction, highest),
    seller,
    bidCount: bids.length,
    bids,
  };
}

/** Articles de l'utilisateur éligibles à une mise aux enchères (actifs, non déjà en enchère). */
export async function getAuctionableArticles(userId: string): Promise<Tables<"articles">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("seller_user_id", userId)
    .eq("status", "active")
    .eq("is_auction", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
