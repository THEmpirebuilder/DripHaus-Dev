import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Category = Tables<"categories">;

/** Toutes les catégories (lecture publique), triées par nom. */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Familles de tête (sans parent) — pour les tuiles de navigation visuelle. */
export async function getTopCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
