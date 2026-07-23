import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/queries/profiles";
import { getArticlesBySeller } from "@/lib/queries/articles";
import { getSessionUser } from "@/lib/auth/session";
import { isFollowing, getFollowerCount } from "@/lib/queries/follows";
import { getReviewsAbout, getRatingSummary } from "@/lib/queries/reviews";
import { Avatar } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { ArticleGrid } from "@/components/article/article-grid";
import { ReviewList } from "@/components/review/review-list";
import { FollowButton } from "@/components/social/follow-button";

type Params = { username: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Profil introuvable" };
  return { title: profile.display_name ?? `@${username}` };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [articles, viewer, followerCount, rating, reviews] = await Promise.all([
    getArticlesBySeller({ userId: profile.user_id }),
    getSessionUser(),
    getFollowerCount({ userId: profile.user_id }),
    getRatingSummary({ userId: profile.user_id }),
    getReviewsAbout({ userId: profile.user_id }),
  ]);

  const isSelf = viewer?.authId === profile.user_id;
  const viewerFollows = viewer && !isSelf ? await isFollowing(viewer.authId, { userId: profile.user_id }) : false;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar_url} name={profile.display_name} size={72} />
          <div>
            <h1 className="text-2xl font-semibold">{profile.display_name ?? `@${username}`}</h1>
            <p className="text-sm text-muted">@{username}</p>
            <p className="text-xs text-muted">{followerCount} abonné{followerCount > 1 ? "s" : ""}</p>
            {rating.count > 0 && <Rating value={rating.average} count={rating.count} className="mt-1" />}
          </div>
        </div>
        {viewer && !isSelf && (
          <FollowButton target={{ userId: profile.user_id }} initialFollowing={viewerFollows} />
        )}
      </div>

      {profile.bio && <p className="mt-6 whitespace-pre-line">{profile.bio}</p>}

      <dl className="mt-6 space-y-2 text-sm">
        {profile.location && (
          <div className="flex gap-2">
            <dt className="text-muted">Localisation</dt>
            <dd>{profile.location}</dd>
          </div>
        )}
        {profile.website_url && (
          <div className="flex gap-2">
            <dt className="text-muted">Site</dt>
            <dd>
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="underline underline-offset-4"
              >
                {profile.website_url}
              </a>
            </dd>
          </div>
        )}
      </dl>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Articles</h2>
        <ArticleGrid articles={articles} emptyLabel="Aucun article en vente." />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Avis</h2>
        <ReviewList reviews={reviews} />
      </section>
    </main>
  );
}
