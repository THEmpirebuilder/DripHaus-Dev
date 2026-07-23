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
