import { notFound, redirect } from "next/navigation";
import { getArticleById } from "@/lib/queries/articles";
import { requireUser } from "@/lib/auth/session";
import { getMyBoutiques } from "@/lib/queries/boutiques";
import { getCategories } from "@/lib/queries/categories";
import { ArticleForm, type SellerOption } from "@/components/article/article-form";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Modifier l'article" };

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();
  const article = await getArticleById(id);
  if (!article) notFound();

  const boutiques = await getMyBoutiques(user.authId);
  const isOwner =
    article.seller_user_id === user.authId ||
    (article.seller_boutique_id != null && boutiques.some((b) => b.id === article.seller_boutique_id));
  if (!isOwner) redirect(`/article/${id}`);

  const categories = await getCategories();
  const sellerOptions: SellerOption[] = [
    { value: "user", label: `Moi (${user.profile.display_name ?? user.email})` },
    ...boutiques.map((b) => ({ value: b.id, label: b.name })),
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Modifier l&apos;article</h1>
      <div className="mt-8">
        <ArticleForm userId={user.authId} sellerOptions={sellerOptions} categories={categories} article={article} />
      </div>
    </main>
  );
}
