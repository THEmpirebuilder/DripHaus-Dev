// ============================================================
// Downloader de packshots Pexels (WS0 0.6)
// - Lit PEXELS_API_KEY depuis .env.local (jamais commité)
// - Cherche par catégorie, télécharge N images/catégorie
// - Écrit un manifeste (attribution photographe + traçabilité)
//
// Usage :
//   node scripts/pexels-fetch.mjs <outDir> [perCategory]
// Ex. node scripts/pexels-fetch.mjs ../demo-assets/packshots 5
// ============================================================
import { readFileSync, mkdirSync, writeFileSync, existsSync, createWriteStream } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// --- Clé API depuis .env.local ---
function loadKey() {
  const envPath = join(ROOT, ".env.local");
  const txt = readFileSync(envPath, "utf8");
  const m = txt.match(/^PEXELS_API_KEY=(.+)$/m);
  if (!m) throw new Error("PEXELS_API_KEY introuvable dans .env.local");
  return m[1].trim();
}

// --- Mapping catégorie (slug DB) -> requête Pexels orientée packshot produit ---
const QUERIES = {
  "t-shirts-tops":   "folded t-shirt clothing white background",
  "chemises-blouses":"folded shirt clothing white background",
  "pulls-gilets":    "folded sweater knitwear",
  "robes":           "woman dress fashion",
  "jeans":           "folded jeans denim",
  "vestes-manteaux": "coat on hanger white background",
  "baskets-sneakers":"sneakers shoes white background",
  "bottes-bottines": "leather boots white background",
  "sacs-a-main":     "handbag leather bag product",
  "montres":         "wristwatch product",
  "lunettes-soleil": "sunglasses product white background",
  "echarpes-foulards":"folded scarf textile",
};

// Ids Pexels hors-sujet repérés sur la 1re planche-contact (option C : on garde le mix,
// on ne vire QUE le vrai hors-sujet : portrait enfant, trépied photographe, mur de pierre, drapeau).
const EXCLUDE = new Set([13562801, 349885, 12198603, 20143798, 29904626]);

const API = "https://api.pexels.com/v1/search";

async function searchCategory(key, query, perCategory) {
  const url = `${API}?query=${encodeURIComponent(query)}&per_page=${Math.max(perCategory * 3, 15)}&orientation=square`;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels ${res.status} pour "${query}"`);
  const json = await res.json();
  return json.photos || [];
}

async function download(src, dest) {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`download ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

async function main() {
  const outDir = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(ROOT, "..", "demo-assets", "packshots");
  const perCategory = parseInt(process.argv[3] || "5", 10);
  const key = loadKey();
  const manifest = [];

  for (const [slug, query] of Object.entries(QUERIES)) {
    const dir = join(outDir, slug);
    mkdirSync(dir, { recursive: true });
    const photos = await searchCategory(key, query, perCategory);
    let taken = 0;
    for (const p of photos) {
      if (taken >= perCategory) break;
      if (EXCLUDE.has(p.id)) continue;
      const dest = join(dir, `${p.id}.jpg`);
      const src = p.src.large; // ~940px, bon compromis
      try {
        if (!existsSync(dest)) await download(src, dest);
        manifest.push({
          category: slug, query, id: p.id, file: `${slug}/${p.id}.jpg`,
          width: p.width, height: p.height, avg_color: p.avg_color,
          alt: p.alt, photographer: p.photographer, photographer_url: p.photographer_url,
          pexels_url: p.url, src,
        });
        taken++;
      } catch (e) {
        console.error(`  skip ${p.id}: ${e.message}`);
      }
    }
    console.log(`${slug}: ${taken} images (${query})`);
  }

  const manifestPath = join(outDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifeste: ${manifestPath} (${manifest.length} entrées)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
