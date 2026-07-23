import { requireUser } from "@/lib/auth/session";
import { getMyBoutiques } from "@/lib/queries/boutiques";
import { getCategories } from "@/lib/queries/categories";
import { ArticleForm, type SellerOption } from "@/components/article/article-form";

export const metadata = { title: "Vendre un article" };

export default async function NewArticlePage() {
  const user = await requireUser();
  const [boutiques, categories] = await Promise.all([
    getMyBoutiques(user.authId),
    getCategories(),
  ]);

  const sellerOptions: SellerOption[] = [
    { value: "user", label: `Moi (${user.profile.display_name ?? user.email})` },
    ...boutiques.map((b) => ({ value: b.id, label: b.name })),
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Vendre un article</h1>
      <p className="mt-1 mb-8 text-sm text-muted">Ajoute des photos et décris ta pièce.</p>
      <ArticleForm userId={user.authId} sellerOptions={sellerOptions} categories={categories} />
    </main>
  );
}
