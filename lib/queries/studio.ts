import { listArticles } from "@/lib/queries/articles";
import { firstImage } from "@/lib/utils/media";
import { houseTier, type HouseTier } from "@/lib/utils/house-tier";

/**
 * Lectures typées pour le Studio IA (couche 2, cf. CLAUDE.md §4). Les pages
 * appellent ces fonctions, jamais Supabase directement.
 *
 * NB — le solde de crédits (`studio_credit_ledger`) n'est pas encore lu ici :
 * la table arrive avec la migration 009 et n'est activée (octrois) qu'avec WB4.
 * À câbler après `types:gen`.
 */

/** Pièce réellement en vente, proposée pour « compléter le look » (famille L). */
export type MatchPiece = {
  id: string;
  title: string;
  brand: string | null;
  price: number;
  currency: string;
  image: string | null;
  size: string | null;
  tier: HouseTier;
};

/**
 * Suggestions de matching depuis l'inventaire LIVE — c'est le moat de la
 * famille L : les pièces proposées sont achetables. Ici, un échantillon réel
 * du catalogue actif ; l'Engine remplacera l'ordre par une recherche
 * vectorielle (Marqo-FashionSigLIP sur pgvector) une fois 009 appliquée.
 */
export async function getMatchingSuggestions(limit = 3): Promise<MatchPiece[]> {
  const { items } = await listArticles({ pageSize: limit });
  return items.map((a) => ({
    id: a.id,
    title: a.title,
    brand: a.brand,
    price: Number(a.price),
    currency: a.currency,
    image: firstImage(a.images),
    size: a.size,
    tier: houseTier(a.brand),
  }));
}
