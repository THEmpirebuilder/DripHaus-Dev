// ============================================================
// Constructeur de catalogue démo (WS0 0.6)
// manifest.json (packshots Pexels) -> supabase/seed/03_articles.sql (idempotent)
//
// - id article déterministe = __demo_uid('article:<pexelsId>')  -> rejouable
// - images = [URL Pexels]  (rendu direct par l'app ; pas d'upload Storage requis)
// - vendeur (XOR user/boutique), titre, marque, état, taille, prix : réalistes FR
// - couleur déduite de avg_color (nearest parmi une palette FR nommée)
// ============================================================
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(join(ROOT, "..", "demo-assets", "packshots", "manifest.json"), "utf8"));

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const uid = (email) => `public.__demo_uid('${email}')`;
const boutiqueId = (h) => `(select id from public.boutiques where handle='${h}')`;
const catId = (slug) => `(select id from public.categories where slug='${slug}')`;

// --- Vendeurs (localisation pour le champ article.location) ---
const B = { HIR: "maison-hirondelle", ARG: "atelier-rive-gauche", FLON: "friperie-du-flon" };
const LOC = {
  "maison-hirondelle": "Vevey", "atelier-rive-gauche": "Genève", "friperie-du-flon": "Lausanne",
  "camille.beguin@demo.driphaus.ch": "Lausanne", "julien.rochat@demo.driphaus.ch": "Genève",
  "lea.progin@demo.driphaus.ch": "Fribourg", "thomas.aebischer@demo.driphaus.ch": "Neuchâtel",
  "noe.girard@demo.driphaus.ch": "Sion", "elodie.favre@demo.driphaus.ch": "Nyon",
  "marine.dubois@demo.driphaus.ch": "Morges", "sofia.moret@demo.driphaus.ch": "Fribourg",
  "yasmine.haddad@demo.driphaus.ch": "Genève", "loic.chappuis@demo.driphaus.ch": "Lausanne",
};
const boutique = (h) => ({ type: "b", key: h });
const user = (email) => ({ type: "u", key: email });

// Palette FR nommée pour déduire la couleur depuis avg_color
const COLORS = [
  ["Noir", 0x11, 0x11, 0x11], ["Blanc", 0xf5, 0xf5, 0xf5], ["Gris", 0x88, 0x88, 0x88],
  ["Beige", 0xcb, 0xb9, 0x94], ["Marron", 0x6b, 0x44, 0x23], ["Camel", 0xb0, 0x80, 0x5a],
  ["Rouge", 0xc0, 0x39, 0x2b], ["Bordeaux", 0x7b, 0x1e, 0x2b], ["Rose", 0xe7, 0x9e, 0xc2],
  ["Orange", 0xe6, 0x7e, 0x22], ["Jaune", 0xf1, 0xc4, 0x0f], ["Vert", 0x27, 0xae, 0x60],
  ["Kaki", 0x6b, 0x7a, 0x3a], ["Bleu", 0x2c, 0x5a, 0xa0], ["Bleu marine", 0x1f, 0x2d, 0x4d],
  ["Denim", 0x4a, 0x6a, 0x8a], ["Turquoise", 0x1a, 0xbc, 0x9c], ["Violet", 0x7d, 0x3c, 0x98],
];
function colorName(hex) {
  if (!hex || hex[0] !== "#") return "Multicolore";
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  let best = "Multicolore", bd = Infinity;
  for (const [name, cr, cg, cb] of COLORS) {
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < bd) { bd = d; best = name; }
  }
  return best;
}

// --- Config par catégorie : vendeurs, titres, marques, tailles, état, fourchette prix ---
const NEW_ISH = ["new", "very_good"], USED = ["very_good", "good", "good", "fair"];
const CAT = {
  "t-shirts-tops": { sellers: [boutique(B.ARG), user("loic.chappuis@demo.driphaus.ch"), user("camille.beguin@demo.driphaus.ch")],
    titles: ["T-shirt en coton bio", "Top oversize", "T-shirt col rond", "Débardeur côtelé", "T-shirt graphique"],
    brands: ["COS", "Armedangels", "American Vintage", "Uniqlo", "Atelier Rive Gauche"], sizes: ["XS","S","M","L","XL"], price: [15, 45] },
  "chemises-blouses": { sellers: [boutique(B.FLON), user("thomas.aebischer@demo.driphaus.ch"), user("julien.rochat@demo.driphaus.ch")],
    titles: ["Chemise en lin", "Chemise oxford", "Blouse fluide", "Chemise vintage", "Chemise en flanelle"],
    brands: ["Ralph Lauren", "Zara", "COS", "Levi's", "Sézane"], sizes: ["S","M","L","XL"], price: [20, 70] },
  "pulls-gilets": { sellers: [boutique(B.ARG), user("lea.progin@demo.driphaus.ch"), user("camille.beguin@demo.driphaus.ch")],
    titles: ["Pull en laine mérinos", "Gilet maille torsadée", "Pull col roulé", "Cardigan oversize", "Pull jacquard"],
    brands: ["COS", "Uniqlo", "American Vintage", "Benetton", "Atelier Rive Gauche"], sizes: ["XS","S","M","L"], price: [30, 90] },
  "robes": { sellers: [boutique(B.HIR), user("sofia.moret@demo.driphaus.ch"), user("elodie.favre@demo.driphaus.ch")],
    titles: ["Robe midi plissée", "Robe portefeuille", "Robe chemise", "Robe de soirée", "Robe en maille"],
    brands: ["Sézane", "Maison Hirondelle", "& Other Stories", "Ba&sh", "Zara"], sizes: ["XS","S","M","L"], price: [40, 160] },
  "jeans": { sellers: [boutique(B.FLON), user("julien.rochat@demo.driphaus.ch"), user("thomas.aebischer@demo.driphaus.ch")],
    titles: ["Jean droit brut", "Jean mom taille haute", "Jean slim délavé", "Jean vintage 501", "Jean bootcut"],
    brands: ["Levi's", "Nudie Jeans", "Weekday", "Wrangler", "Acne Studios"], sizes: ["W28","W29","W30","W31","W32","W33"], price: [25, 110] },
  "vestes-manteaux": { sellers: [boutique(B.ARG), boutique(B.FLON), user("marine.dubois@demo.driphaus.ch")],
    titles: ["Manteau en laine", "Veste en jean", "Blazer oversize", "Trench-coat", "Veste workwear"],
    brands: ["COS", "Levi's", "Sandro", "Burberry", "Carhartt"], sizes: ["S","M","L","XL"], price: [50, 240] },
  "baskets-sneakers": { sellers: [user("julien.rochat@demo.driphaus.ch"), user("noe.girard@demo.driphaus.ch"), user("loic.chappuis@demo.driphaus.ch")],
    titles: ["Sneakers basses en cuir", "Baskets running rétro", "Sneakers montantes", "Baskets en toile", "Sneakers chunky"],
    brands: ["Nike", "Adidas", "New Balance", "Veja", "Converse"], sizes: ["39","40","41","42","43","44"], price: [35, 150] },
  "bottes-bottines": { sellers: [boutique(B.FLON), user("marine.dubois@demo.driphaus.ch"), user("elodie.favre@demo.driphaus.ch")],
    titles: ["Bottines en cuir", "Boots Chelsea", "Bottes hautes", "Bottines à lacets", "Boots à talon"],
    brands: ["Dr. Martens", "Clarks", "Sézane", "Vagabond", "Timberland"], sizes: ["37","38","39","40","41"], price: [40, 180] },
  "sacs-a-main": { sellers: [boutique(B.HIR), user("marine.dubois@demo.driphaus.ch"), user("sofia.moret@demo.driphaus.ch")],
    titles: ["Sac cabas en cuir", "Sac porté épaule", "Sac seau", "Sac à main structuré", "Sac hobo"],
    brands: ["Longchamp", "Michael Kors", "Polène", "Maison Hirondelle", "Coach"], sizes: ["Unique"], price: [45, 260] },
  "montres": { sellers: [user("thomas.aebischer@demo.driphaus.ch"), user("julien.rochat@demo.driphaus.ch"), user("noe.girard@demo.driphaus.ch")],
    titles: ["Montre automatique", "Montre chronographe", "Montre habillée", "Montre vintage", "Montre à quartz"],
    brands: ["Seiko", "Casio", "Tissot", "Citizen", "Swatch"], sizes: ["Unique"], price: [60, 320] },
  "lunettes-soleil": { sellers: [user("elodie.favre@demo.driphaus.ch"), user("marine.dubois@demo.driphaus.ch"), user("sofia.moret@demo.driphaus.ch")],
    titles: ["Lunettes de soleil rondes", "Lunettes aviateur", "Lunettes œil-de-chat", "Lunettes carrées", "Lunettes rétro"],
    brands: ["Ray-Ban", "Persol", "Le Specs", "Komono", "Chimi"], sizes: ["Unique"], price: [25, 130] },
  "echarpes-foulards": { sellers: [boutique(B.HIR), user("lea.progin@demo.driphaus.ch"), user("camille.beguin@demo.driphaus.ch")],
    titles: ["Écharpe en laine", "Foulard en soie", "Étole oversize", "Écharpe à franges", "Foulard imprimé"],
    brands: ["Acne Studios", "Sézane", "Maison Hirondelle", "COS", "Faliero Sarti"], sizes: ["Unique"], price: [20, 95] },
};

const rows = [];
const perCat = {};
const seen = new Set(); // dédoublonnage : une image Pexels = un seul article
for (const e of manifest) {
  const cfg = CAT[e.category];
  if (!cfg) continue;
  if (seen.has(e.id)) continue;
  seen.add(e.id);
  const i = (perCat[e.category] = (perCat[e.category] ?? 0) + 1) - 1; // index dans la catégorie
  const seller = cfg.sellers[i % cfg.sellers.length];
  const isBoutique = seller.type === "b";
  const title = cfg.titles[i % cfg.titles.length];
  const brand = cfg.brands[i % cfg.brands.length];
  const size = cfg.sizes[i % cfg.sizes.length];
  const color = colorName(e.avg_color);
  const condPool = isBoutique ? NEW_ISH : USED;
  const condition = condPool[i % condPool.length];
  const [lo, hi] = cfg.price;
  const price = (Math.round((lo + ((hi - lo) * ((i * 37) % 100)) / 100) / 5) * 5) - 0.05; // prix en .95, varié
  const loc = LOC[seller.key];
  const condFr = { new: "Neuf", very_good: "Très bon état", good: "Bon état", fair: "État correct" }[condition];
  const desc = `${title} ${brand !== "" ? `— ${brand}. ` : ". "}${color}, taille ${size}. ${condFr}. ${isBoutique ? "Expédié depuis notre boutique" : "Vendu par un particulier"} à ${loc}.`;
  const daysAgo = (i * 3 + (e.category.length % 7)) % 45; // étalement création

  rows.push({
    id: `__demo_uid('article:${e.id}')`,
    seller_user_id: isBoutique ? "null" : uid(seller.key),
    seller_boutique_id: isBoutique ? boutiqueId(seller.key) : "null",
    category_id: catId(e.category),
    title, description: desc, brand, condition, size, color,
    price: price.toFixed(2), images: JSON.stringify([e.src]), location: loc, daysAgo,
  });
}

// --- Génération SQL ---
let sql = `-- ============================================================
-- SEED 03 — Articles (catalogue démo)  [généré par scripts/build-catalogue.mjs]
-- Idempotent : id = __demo_uid('article:<pexelsId>'), upsert on conflict.
-- Images = URLs Pexels (licence commerciale libre). ${rows.length} articles.
-- ============================================================

create or replace function public.__demo_uid(p text) returns uuid language sql immutable as $$
  select (substr(md5(p),1,8)||'-'||substr(md5(p),9,4)||'-'||substr(md5(p),13,4)||'-'||substr(md5(p),17,4)||'-'||substr(md5(p),21,12))::uuid
$$;

insert into public.articles (id, seller_user_id, seller_boutique_id, category_id, title, description, brand, condition, size, color, price, currency, images, status, is_auction, location, created_at) values
`;
sql += rows.map((r) =>
  `  (public.${r.id}, ${r.seller_user_id}, ${r.seller_boutique_id}, ${r.category_id}, ${q(r.title)}, ${q(r.description)}, ${q(r.brand)}, ${q(r.condition)}::public.article_condition, ${q(r.size)}, ${q(r.color)}, ${r.price}, 'CHF', ${q(r.images)}::jsonb, 'active', false, ${q(r.location)}, now() - interval '${r.daysAgo} days')`
).join(",\n");
sql += `
on conflict (id) do update set
  seller_user_id=excluded.seller_user_id, seller_boutique_id=excluded.seller_boutique_id, category_id=excluded.category_id,
  title=excluded.title, description=excluded.description, brand=excluded.brand, condition=excluded.condition,
  size=excluded.size, color=excluded.color, price=excluded.price, images=excluded.images, status=excluded.status, location=excluded.location;
`;

writeFileSync(join(ROOT, "supabase", "seed", "03_articles.sql"), sql);
console.log(`03_articles.sql généré : ${rows.length} articles.`);
