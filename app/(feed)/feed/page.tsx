import { getFeedPage } from "@/lib/queries/posts";
import { getSessionUser } from "@/lib/auth/session";
import { getMyBoutiques, getSuggestedBoutiques } from "@/lib/queries/boutiques";
import { PostComposer, type AuthorOption } from "@/components/social/post-composer";
import { PostCard } from "@/components/social/post-card";
import { StoryRail } from "@/components/social/story-rail";
import { FeedRail } from "@/components/social/feed-rail";
import { Pagination } from "@/components/marketplace/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Feed" };

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, Number(pageParam ?? 0) || 0);

  const viewer = await getSessionUser();
  const [{ items: posts, hasMore }, boutiques, suggested] = await Promise.all([
    getFeedPage(viewer?.authId, page),
    viewer ? getMyBoutiques(viewer.authId) : Promise.resolve([]),
    getSuggestedBoutiques(8),
  ]);

  const authorOptions: AuthorOption[] = viewer
    ? [
        { value: "user", label: `Moi (${viewer.profile.display_name ?? "mon profil"})` },
        ...boutiques.map((b) => ({ value: b.id, label: b.name })),
      ]
    : [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <div className="u-label mb-1.5 text-[10px] text-accent">La communauté</div>
        <h1 className="t-h1">Feed</h1>
      </div>

      <StoryRail boutiques={suggested} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          {viewer && page === 0 && <PostComposer userId={viewer.authId} authorOptions={authorOptions} />}

          {posts.length === 0 ? (
            <EmptyState title="Le feed est encore vide." description="Sois le premier à publier." />
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}

          <Pagination
            page={page}
            prevHref={page > 0 ? (page - 1 === 0 ? "/feed" : `/feed?page=${page - 1}`) : null}
            nextHref={hasMore ? `/feed?page=${page + 1}` : null}
          />
        </div>

        <aside className="hidden lg:block">
          <FeedRail boutiques={suggested} canFollow={!!viewer} />
        </aside>
      </div>
    </main>
  );
}
