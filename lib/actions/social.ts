"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import type { FollowTarget } from "@/lib/queries/follows";
import type { TablesInsert } from "@/types/database";

export type PostFormState = { error?: string };
export type CommentFormState = { error?: string };

function parseImages(raw: string): string[] {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Publie un post (auteur = user OU boutique via le champ `author`). */
export async function createPostAction(
  _prev: PostFormState,
  formData: FormData
): Promise<PostFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const content = String(formData.get("content") ?? "").trim();
  const images = parseImages(String(formData.get("images") ?? "[]"));
  const articleId = String(formData.get("article_id") ?? "").trim() || null;
  const author = String(formData.get("author") ?? "user");

  if (!content && images.length === 0 && !articleId) {
    return { error: "Écris un message ou ajoute une image." };
  }

  const authorCols =
    author === "user"
      ? { author_user_id: user.authId, author_boutique_id: null }
      : { author_user_id: null, author_boutique_id: author };

  const insert: TablesInsert<"posts"> = {
    ...authorCols,
    content: content || null,
    media: images,
    article_id: articleId,
    type: articleId ? "article_share" : "organic",
    status: "published",
  };

  const { error } = await supabase.from("posts").insert(insert);
  if (error) return { error: error.message };

  revalidatePath("/feed");
  redirect("/feed");
}

/** Bascule le like du viewer sur un post. */
export async function toggleLike(postId: string): Promise<{ liked: boolean }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.authId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    return { liked: false };
  }

  await supabase.from("likes").insert({ post_id: postId, user_id: user.authId });
  return { liked: true };
}

/** Ajoute un commentaire à un post. */
export async function addCommentAction(
  _prev: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const postId = String(formData.get("post_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!postId) return { error: "Post introuvable." };
  if (!content) return { error: "Le commentaire est vide." };

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.authId,
    content,
  });
  if (error) return { error: error.message };

  revalidatePath(`/feed/${postId}`);
  return {};
}

/** Supprime un commentaire (propriétaire uniquement via RLS). */
export async function deleteCommentAction(formData: FormData): Promise<void> {
  await requireUser();
  const supabase = await createClient();

  const id = String(formData.get("comment_id") ?? "");
  const postId = String(formData.get("post_id") ?? "");
  await supabase.from("comments").delete().eq("id", id);
  revalidatePath(`/feed/${postId}`);
}

/** Bascule l'abonnement du viewer sur une cible (user OU boutique). */
export async function toggleFollow(target: FollowTarget): Promise<{ following: boolean }> {
  const user = await requireUser();
  const supabase = await createClient();

  const column = target.userId ? "followed_user_id" : "followed_boutique_id";
  const value = target.userId ?? target.boutiqueId;
  if (!value) return { following: false };

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_user_id", user.authId)
    .eq(column, value)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
    return { following: false };
  }

  await supabase.from("follows").insert({
    follower_user_id: user.authId,
    followed_user_id: target.userId ?? null,
    followed_boutique_id: target.boutiqueId ?? null,
  });
  return { following: true };
}
