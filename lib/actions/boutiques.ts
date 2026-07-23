"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

export type BoutiqueFormState = { error?: string; success?: boolean };
export type MemberFormState = { error?: string; success?: boolean };

const HANDLE_RE = /^[a-z0-9-]{3,40}$/;

/**
 * Crée une boutique (statut `pending`, imposé par la RLS) puis inscrit le
 * créateur comme `owner`. L'id est généré côté serveur pour éviter un SELECT
 * post-insert (la RLS masque une boutique pending sans membre).
 */
export async function createBoutiqueAction(
  _prev: BoutiqueFormState,
  formData: FormData
): Promise<BoutiqueFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) return { error: "Le nom de la boutique est requis." };
  if (!HANDLE_RE.test(handle)) {
    return { error: "Handle invalide : 3 à 40 caractères, minuscules, chiffres ou « - »." };
  }

  const boutiqueId = randomUUID();

  const { error: boutiqueError } = await supabase.from("boutiques").insert({
    id: boutiqueId,
    name,
    handle,
    description: description || null,
    status: "pending",
    email_contact: user.email,
  });

  if (boutiqueError) {
    if (boutiqueError.code === "23505") return { error: "Ce handle est déjà pris." };
    return { error: boutiqueError.message };
  }

  const { error: memberError } = await supabase.from("boutique_members").insert({
    boutique_id: boutiqueId,
    user_id: user.authId,
    role: "owner",
  });

  if (memberError) {
    return { error: `Boutique créée mais rattachement échoué : ${memberError.message}` };
  }

  revalidatePath("/", "layout");
  redirect(`/boutique/${handle}/manage`);
}

/** Met à jour les informations d'une boutique (réservé aux membres via RLS). */
export async function updateBoutiqueAction(
  _prev: BoutiqueFormState,
  formData: FormData
): Promise<BoutiqueFormState> {
  await requireUser();
  const supabase = await createClient();

  const boutiqueId = String(formData.get("boutique_id") ?? "");
  const handle = String(formData.get("handle") ?? "");
  if (!boutiqueId) return { error: "Boutique introuvable." };

  const { error } = await supabase
    .from("boutiques")
    .update({
      name: String(formData.get("name") ?? "").trim() || undefined,
      description: String(formData.get("description") ?? "").trim() || null,
      email_contact: String(formData.get("email_contact") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      website_url: String(formData.get("website_url") ?? "").trim() || null,
    })
    .eq("id", boutiqueId);

  if (error) return { error: error.message };

  revalidatePath(`/boutique/${handle}`);
  revalidatePath(`/boutique/${handle}/manage`);
  return { success: true };
}

/** Ajoute un membre (manager) via son username. Réservé à l'owner (RLS). */
export async function addMemberAction(
  _prev: MemberFormState,
  formData: FormData
): Promise<MemberFormState> {
  await requireUser();
  const supabase = await createClient();

  const boutiqueId = String(formData.get("boutique_id") ?? "");
  const handle = String(formData.get("handle") ?? "");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  if (!boutiqueId || !username) return { error: "Nom d'utilisateur requis." };

  // Résolution username -> user_id via profiles (lecture publique).
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return { error: `Aucun utilisateur « ${username} ».` };

  const { error } = await supabase.from("boutique_members").insert({
    boutique_id: boutiqueId,
    user_id: profile.user_id,
    role: "manager",
  });

  if (error) {
    if (error.code === "23505") return { error: "Cette personne est déjà membre." };
    return { error: error.message };
  }

  revalidatePath(`/boutique/${handle}/manage`);
  return { success: true };
}

/** Retire un membre (owner) ou permet à un membre de quitter la boutique. */
export async function removeMemberAction(formData: FormData): Promise<void> {
  await requireUser();
  const supabase = await createClient();

  const boutiqueId = String(formData.get("boutique_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const handle = String(formData.get("handle") ?? "");

  await supabase
    .from("boutique_members")
    .delete()
    .eq("boutique_id", boutiqueId)
    .eq("user_id", userId);

  revalidatePath(`/boutique/${handle}/manage`);
}
