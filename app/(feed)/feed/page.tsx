import { getFeed } from "@/lib/queries/posts";
import { getSessionUser } from "@/lib/auth/session";
import { getMyBoutiques } from "@/lib/queries/boutiques";
import { PostComposer, type AuthorOption } from "@/components/social/post-composer";
import { PostCard } from "@/components/social/post-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Feed" };

export default async function FeedPage() {
  const viewer = await getSessionUser();
  const [posts, boutiques] = await Promise.all([
    getFeed(viewer?.authId),
    viewer ? getMyBoutiques(viewer.authId) : Promise.resolve([]),
  ]);

  const authorOptions: AuthorOption[] = viewer
    ? [
        { value: "user", label: `Moi (${viewer.profile.display_name ?? "mon profil"})` },
        ...boutiques.map((b) => ({ value: b.id, label: b.name })),
      ]
    : [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Feed</h1>

      {viewer && <PostComposer userId={viewer.authId} authorOptions={authorOptions} />}

      <div className="mt-6 space-y-6">
        {posts.length === 0 ? (
          <EmptyState title="Le feed est encore vide." description="Sois le premier à publier." />
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </main>
  );
}
