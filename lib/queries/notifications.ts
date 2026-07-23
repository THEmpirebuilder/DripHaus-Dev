import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Notification = Tables<"notifications">;

/** Notifications de l'utilisateur (RLS : destinataire uniquement). */
export async function getNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Nombre de notifications non lues. */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}
