"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

export type ProfileFormState = {
  error?: string;
  success?: boolean;
};

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

/**
 * Met à jour le profil de l'utilisateur connecté.
 * - `username` : écrit UNIQUEMENT dans `users.username` (source de vérité) ;
 *   la propagation vers `profiles.username` est assurée par un trigger.
 * - Le reste (display_name, bio, location, website_url) va dans `profiles`.
 */
export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const usernameRaw = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();

  if (usernameRaw && !USERNAME_RE.test(usernameRaw)) {
    return {
      error:
        "Nom d'utilisateur invalide : 3 à 30 caractères, minuscules, chiffres ou « _ ».",
    };
  }

  // 1) username → users (source de vérité), seulement s'il a changé.
  if (usernameRaw && usernameRaw !== user.account.username) {
    const { error } = await supabase
      .from("users")
      .update({ username: usernameRaw })
      .eq("id", user.authId);

    if (error) {
      if (error.code === "23505") {
        return { error: "Ce nom d'utilisateur est déjà pris." };
      }
      return { error: error.message };
    }
  }

  // 2) Données publiques → profiles.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      bio: bio || null,
      location: location || null,
      website_url: websiteUrl || null,
    })
    .eq("user_id", user.authId);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath("/profile");
  return { success: true };
}
