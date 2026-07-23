import { createClient } from "@/lib/supabase/server";
import { getProfilesByUserIds } from "@/lib/queries/profiles";
import { getBoutiquesByIds } from "@/lib/queries/boutiques";
import type { Tables } from "@/types/database";

export type PostAuthor = {
  kind: "user" | "boutique";
  name: string;
  href: string;
  avatarUrl: string | null;
};

export type ArticlePreview = Pick<
  Tables<"articles">,
  "id" | "title" | "price" | "currency" | "images" | "status"
> | null;

export type FeedPost = Tables<"posts"> & {
  author: PostAuthor | null;
  article: ArticlePreview;
  likeCount: number;
  commentCount: number;
  viewerLiked: boolean;
};

type RawPost = Tables<"posts"> & { article: ArticlePreview };

/** Enrichit une liste de posts : auteur résolu, compteurs, like du viewer. */
async function decoratePosts(posts: RawPost[], viewerId?: string): Promise<FeedPost[]> {
  if (posts.length === 0) return [];
  const supabase = await createClient();
  const ids = posts.map((p) => p.id);

  const [profiles, boutiques, likesRes, commentsRes, viewerLikesRes] = await Promise.all([
    getProfilesByUserIds(posts.map((p) => p.author_user_id).filter((x): x is string => !!x)),
    getBoutiquesByIds(posts.map((p) => p.author_boutique_id).filter((x): x is string => !!x)),
    supabase.from("likes").select("post_id").in("post_id", ids),
    supabase.from("comments").select("post_id").in("post_id", ids).eq("status", "active"),
    viewerId
      ? supabase.from("likes").select("post_id").eq("user_id", viewerId).in("post_id", ids)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const tally = (rows: { post_id: string }[] | null) => {
    const map = new Map<string, number>();
    for (const r of rows ?? []) map.set(r.post_id, (map.get(r.post_id) ?? 0) + 1);
    return map;
  };
  const likeCounts = tally(likesRes.data);
  const commentCounts = tally(commentsRes.data);
  const viewerLiked = new Set((viewerLikesRes.data ?? []).map((r) => r.post_id));

  return posts.map((p) => {
    let author: PostAuthor | null = null;
    if (p.author_user_id) {
      const prof = profiles.get(p.author_user_id);
      author = prof
        ? {
            kind: "user",
            name: prof.display_name ?? prof.username ?? "Utilisateur",
            href: prof.username ? `/u/${prof.username}` : "#",
            avatarUrl: prof.avatar_url,
          }
        : null;
    } else if (p.author_boutique_id) {
      const b = boutiques.get(p.author_boutique_id);
      author = b ? { kind: "boutique", name: b.name, href: `/boutique/${b.handle}`, avatarUrl: b.logo_url } : null;
    }

    return {
      ...p,
      author,
      likeCount: likeCounts.get(p.id) ?? 0,
      commentCount: commentCounts.get(p.id) ?? 0,
      viewerLiked: viewerLiked.has(p.id),
    };
  });
}

const POST_SELECT = "*, article:articles(id, title, price, currency, images, status)";

/** Feed chronologique des posts publiés. */
export async function getFeed(viewerId?: string, limit = 30): Promise<FeedPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return decoratePosts((data ?? []) as RawPost[], viewerId);
}

export const FEED_PAGE_SIZE = 20;

export type FeedPage = { items: FeedPost[]; page: number; hasMore: boolean };

/** Feed paginé (Précédent / Suivant). */
export async function getFeedPage(viewerId?: string, page = 0, pageSize = FEED_PAGE_SIZE): Promise<FeedPage> {
  const supabase = await createClient();
  const from = Math.max(0, page) * pageSize;

  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(from, from + pageSize); // pageSize+1 pour déduire hasMore
  if (error) throw error;

  const rows = (data ?? []) as RawPost[];
  const hasMore = rows.length > pageSize;
  const items = await decoratePosts(hasMore ? rows.slice(0, pageSize) : rows, viewerId);
  return { items, page: Math.max(0, page), hasMore };
}

/** Un post enrichi (ou null). */
export async function getPostById(id: string, viewerId?: string): Promise<FeedPost | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [decorated] = await decoratePosts([data as RawPost], viewerId);
  return decorated ?? null;
}

export type CommentWithAuthor = Tables<"comments"> & { author: PostAuthor | null };

/** Commentaires actifs d'un post, du plus ancien au plus récent, avec auteur. */
export async function getCommentsForPost(postId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .eq("status", "active")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const rows = data ?? [];
  const profiles = await getProfilesByUserIds(rows.map((c) => c.user_id));

  return rows.map((c) => {
    const prof = profiles.get(c.user_id);
    return {
      ...c,
      author: prof
        ? {
            kind: "user",
            name: prof.display_name ?? prof.username ?? "Utilisateur",
            href: prof.username ? `/u/${prof.username}` : "#",
            avatarUrl: prof.avatar_url,
          }
        : null,
    };
  });
}
