import type { Json } from "@/types/database";

/** Extrait la liste d'URL d'images depuis une colonne jsonb (`images`, `media`). */
export function toImageUrls(value: Json): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

/** Première image ou `null`. */
export function firstImage(value: Json): string | null {
  return toImageUrls(value)[0] ?? null;
}
