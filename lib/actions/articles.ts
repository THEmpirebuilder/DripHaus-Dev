"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { Constants, type Enums, type TablesInsert } from "@/types/database";

export type ArticleFormState = { error?: string };

const CONDITIONS = Constants.public.Enums.article_condition;

function parseImages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Construit la paire vendeur XOR à partir du champ `seller` du formulaire. */
function sellerColumns(seller: string, userId: string): Pick<TablesInsert<"articles">, "seller_user_id" | "seller_boutique_id"> {
  if (seller === "user") return { seller_user_id: userId, seller_boutique_id: null };
  return { seller_user_id: null, seller_boutique_id: seller };
}

function readArticleFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const price = Number(formData.get("price"));
  const conditionRaw = String(formData.get("condition") ?? "");
  const condition = (CONDITIONS as readonly string[]).includes(conditionRaw)
    ? (conditionRaw as Enums<"article_condition">)
    : null;
  const categoryId = String(formData.get("category_id") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "active") === "draft" ? "draft" : "active";

  return {
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    price,
    condition,
    category_id: categoryId,
    brand: String(formData.get("brand") ?? "").trim() || null,
    size: String(formData.get("size") ?? "").trim() || null,
    color: String(formData.get("color") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    images: parseImages(String(formData.get("images") ?? "[]")),
    status: status as Enums<"article_status">,
  };
}

export async function createArticleAction(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const fields = readArticleFields(formData);
  const seller = String(formData.get("seller") ?? "user");

  if (!fields.title) return { error: "Le titre est requis." };
  if (!Number.isFinite(fields.price) || fields.price <= 0) {
    return { error: "Le prix doit être un montant positif." };
  }

  const { data, error } = await supabase
    .from("articles")
    .insert({ ...fields, ...sellerColumns(seller, user.authId), currency: "CHF" })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/marketplace");
  redirect(`/article/${data.id}`);
}

export async function updateArticleAction(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  await requireUser();
  const supabase = await createClient();

  const id = String(formData.get("article_id") ?? "");
  if (!id) return { error: "Article introuvable." };

  const fields = readArticleFields(formData);
  if (!fields.title) return { error: "Le titre est requis." };
  if (!Number.isFinite(fields.price) || fields.price <= 0) {
    return { error: "Le prix doit être un montant positif." };
  }

  const { error } = await supabase.from("articles").update(fields).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/article/${id}`);
  revalidatePath("/marketplace");
  redirect(`/article/${id}`);
}

/** Archive un article (soft delete : conserve l'historique des transactions). */
export async function archiveArticleAction(formData: FormData): Promise<void> {
  await requireUser();
  const supabase = await createClient();

  const id = String(formData.get("article_id") ?? "");
  if (!id) return;

  await supabase.from("articles").update({ status: "archived" }).eq("id", id);
  revalidatePath("/marketplace");
  redirect("/profile");
}
