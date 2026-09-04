"use client";

import { createClient } from "@/lib/supabase/client";

export const MEDIA_BUCKET = "media";

/** Types d'images autorisés à l'upload (doit rester aligné avec le bucket Supabase). */
export const ALLOWED_MEDIA_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** Taille maximale par fichier : 8 Mo. */
export const MAX_MEDIA_BYTES = 8 * 1024 * 1024;

/** Extension de fichier sûre déduite du type MIME (on n'utilise pas le nom fourni). */
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Téléverse un fichier image dans le bucket public `media`, sous le dossier de
 * l'utilisateur (`{userId}/...`), et renvoie son URL publique.
 * Valide le type MIME et la taille AVANT l'upload (première ligne de défense ;
 * le bucket Supabase doit aussi restreindre `allowed_mime_types` + taille).
 * Appelé côté navigateur (RLS Storage appliquées).
 */
export async function uploadMedia(file: File, userId: string): Promise<string> {
  if (!(ALLOWED_MEDIA_MIME as readonly string[]).includes(file.type)) {
    throw new Error(
      `Type de fichier non autorisé (${file.type || "inconnu"}). Formats acceptés : JPEG, PNG, WebP, AVIF.`,
    );
  }
  if (file.size > MAX_MEDIA_BYTES) {
    throw new Error(
      `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum : ${MAX_MEDIA_BYTES / 1024 / 1024} Mo.`,
    );
  }

  const supabase = createClient();
  // Extension dérivée du type MIME validé, jamais du nom d'origine (anti-spoof).
  const ext = EXT_BY_MIME[file.type] ?? "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
