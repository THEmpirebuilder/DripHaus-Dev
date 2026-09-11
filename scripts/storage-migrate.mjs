// ============================================================
// Migration des images de démo : Pexels (hotlink) -> Supabase Storage (bucket `media`)
// WS0 — "seed direct + Storage". Idempotent (upsert sur le même chemin).
//
// - Upload admin (service_role) des packshots locaux dans media/{ownerUserId}/{articleId}.jpg
//   -> mime détecté depuis les octets (jpeg/png), comme un vrai upload rangé par vendeur.
// - Repointe articles.images sur l'URL publique Storage.
//
// Usage : node scripts/storage-migrate.mjs
// ============================================================
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKSHOTS = join(ROOT, "..", "demo-assets", "packshots");

// --- env depuis .env.local ---
const env = readFileSync(join(ROOT, ".env.local"), "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.+)$`, "m")) || [])[1]?.trim();
const supabase = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
const BUCKET = "media";

// --- index local : pexelsId -> chemin fichier ---
const fileById = new Map();
for (const cat of readdirSync(PACKSHOTS)) {
  const dir = join(PACKSHOTS, cat);
  if (!statSync(dir).isDirectory()) continue;
  for (const f of readdirSync(dir)) {
    const m = f.match(/^(\d+)\.(jpg|jpeg|png)$/i);
    if (m && !fileById.has(m[1])) fileById.set(m[1], join(dir, f));
  }
}

const mimeOf = (buf) =>
  buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 ? "image/png" : "image/jpeg";
const pexelsId = (url) => (url.match(/\/photos\/(\d+)\//) || [])[1];

async function main() {
  // owners de boutiques : boutiqueId -> userId (role owner)
  const { data: members, error: mErr } = await supabase
    .from("boutique_members").select("boutique_id, user_id").eq("role", "owner");
  if (mErr) throw mErr;
  const ownerOf = new Map(members.map((m) => [m.boutique_id, m.user_id]));

  // articles de démo (image Pexels) — filtre JS car `images` est jsonb
  const { data: all, error: aErr } = await supabase
    .from("articles").select("id, images, seller_user_id, seller_boutique_id");
  if (aErr) throw aErr;
  const articles = all.filter((a) => Array.isArray(a.images) && String(a.images[0] || "").includes("images.pexels.com"));
  console.log(`${articles.length} articles à migrer (sur ${all.length}).`);

  let ok = 0, skip = 0;
  for (const a of articles) {
    const url = Array.isArray(a.images) ? a.images[0] : null;
    const id = url && pexelsId(url);
    const file = id && fileById.get(id);
    if (!file) { console.warn(`  skip ${a.id} (fichier local introuvable pour ${id})`); skip++; continue; }

    const owner = a.seller_user_id || ownerOf.get(a.seller_boutique_id);
    if (!owner) { console.warn(`  skip ${a.id} (owner introuvable)`); skip++; continue; }

    const buf = readFileSync(file);
    const mime = mimeOf(buf);
    const ext = mime === "image/png" ? "png" : "jpg";
    const path = `${owner}/${a.id}.${ext}`;

    const { error: upErr } = await supabase.storage.from(BUCKET)
      .upload(path, buf, { contentType: mime, upsert: true, cacheControl: "3600" });
    if (upErr) { console.error(`  ERREUR upload ${a.id}: ${upErr.message}`); skip++; continue; }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const { error: updErr } = await supabase.from("articles").update({ images: [pub.publicUrl] }).eq("id", a.id);
    if (updErr) { console.error(`  ERREUR update ${a.id}: ${updErr.message}`); skip++; continue; }
    ok++;
  }
  console.log(`\nTerminé : ${ok} migrés, ${skip} ignorés.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
