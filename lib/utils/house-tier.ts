/**
 * Niveaux de maison (charte, page 07). Le catalogue se lit sur trois registres,
 * distingués par le métal du losange — jamais par un mot dévalorisant.
 *   or      → haute maroquinerie & couture
 *   bronze  → griffes établies, prêt-à-porter premium (registre par défaut)
 *   argent  → outdoor, sport et streetwear de qualité
 * Présentation pure : mappe une marque connue vers son registre. Marque inconnue
 * ou absente → bronze (le registre médian, jamais dévalorisant).
 */
export type HouseTier = "or" | "bronze" | "argent";

export const TIER_LABEL: Record<HouseTier, string> = {
  or: "Maison",
  bronze: "Signature",
  argent: "Sélection",
};

const norm = (s: string) => s.trim().toLowerCase().replace(/[.'’®]/g, "").replace(/\s+/g, " ");

const OR = new Set(
  [
    "louis vuitton", "balenciaga", "dior", "prada", "celine", "céline", "hermes", "hermès",
    "chanel", "gucci", "saint laurent", "bottega veneta", "loewe", "longchamp", "polene",
    "polène", "delvaux",
  ].map(norm)
);

const ARGENT = new Set(
  [
    "the north face", "north face", "patagonia", "carhartt", "arcteryx", "arc'teryx", "nike",
    "adidas", "new balance", "converse", "vans", "reebok", "puma", "dr martens", "dr. martens",
    "timberland", "clarks", "vagabond", "salomon", "columbia", "levis", "levi's", "wrangler",
    "nudie", "nudie jeans", "weekday", "ray ban", "ray-ban", "persol", "le specs", "komono",
  ].map(norm)
);

export function houseTier(brand?: string | null): HouseTier {
  if (!brand) return "bronze";
  const b = norm(brand);
  if (OR.has(b)) return "or";
  if (ARGENT.has(b)) return "argent";
  return "bronze";
}
