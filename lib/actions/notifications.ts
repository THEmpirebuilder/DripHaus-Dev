"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

/** Marque une notification comme lue. */
export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();
  const id = String(formData.get("notification_id") ?? "");
  if (!id) return;

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.authId);
  revalidatePath("/notifications");
}

/** Marque toutes les notifications comme lues. */
export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await requireUser();
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.authId)
    .eq("is_read", false);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
}
