"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/utils/site-url";
import { Constants, type Enums } from "@/types/database";

/** État renvoyé aux formulaires (via useActionState). */
export type AuthFormState = {
  error?: string;
  /** Message informatif non bloquant (ex. « vérifie ta boîte mail »). */
  message?: string;
};

const ROLES = Constants.public.Enums.user_role;

function isRole(value: string): value is Enums<"user_role"> {
  return (ROLES as readonly string[]).includes(value);
}

/**
 * Inscription. Le rôle et le nom d'affichage passent dans les metadata :
 * le trigger `on_auth_user_created` crée alors `public.users` + `public.profiles`.
 */
export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const role = String(formData.get("role") ?? "particulier");

  if (!email || !password) {
    return { error: "E-mail et mot de passe sont requis." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (!isRole(role)) {
    return { error: "Type de compte invalide." };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm`,
      data: {
        role,
        display_name: displayName || email.split("@")[0],
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Confirmation e-mail activée : pas de session immédiate.
  if (!data.session) {
    return {
      message:
        "Compte créé. Vérifie ta boîte mail pour confirmer ton adresse avant de te connecter.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

/** Connexion par e-mail / mot de passe. */
export async function signInAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-mail et mot de passe sont requis." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou mot de passe incorrect." };
  }

  revalidatePath("/", "layout");
  redirect("/profile");
}

/** Déconnexion. Utilisable directement comme `action` d'un formulaire. */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
