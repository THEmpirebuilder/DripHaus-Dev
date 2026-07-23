import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileByUsername } from "@/lib/queries/profiles";
import { getArticlesBySeller } from "@/lib/queries/articles";
import { Avatar } from "@/components/ui/avatar";
import { ArticleGrid } from "@/components/article/article-grid";

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

  const articles = await getArticlesBySeller({ userId: profile.user_id });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center gap-4">
        <Avatar src={profile.avatar_url} name={profile.display_name} size={72} />
        <div>
          <h1 className="text-2xl font-semibold">{profile.display_name ?? `@${username}`}</h1>
          <p className="text-sm text-muted">@{username}</p>
        </div>
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
    </main>
  );
}
