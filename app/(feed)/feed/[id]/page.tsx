import { notFound } from "next/navigation";
import { getPostById, getCommentsForPost } from "@/lib/queries/posts";
import { getSessionUser } from "@/lib/auth/session";
import { PostCard } from "@/components/social/post-card";
import { CommentSection } from "@/components/social/comment-section";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Publication" };

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const viewer = await getSessionUser();

  const post = await getPostById(id, viewer?.authId);
  if (!post) notFound();

  const comments = await getCommentsForPost(id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <PostCard post={post} />
      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Commentaires</h2>
        <CommentSection postId={id} comments={comments} currentUserId={viewer?.authId ?? null} />
      </section>
    </main>
  );
}
