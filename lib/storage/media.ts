"use client";

import { createClient } from "@/lib/supabase/client";

export const MEDIA_BUCKET = "media";

/**
 * Téléverse un fichier dans le bucket public `media`, sous le dossier de
 * l'utilisateur (`{userId}/...`), et renvoie son URL publique.
 * Appelé côté navigateur (RLS Storage appliquées).
 */
export async function uploadMedia(file: File, userId: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
