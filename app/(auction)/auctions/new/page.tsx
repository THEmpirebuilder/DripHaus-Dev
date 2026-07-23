import { requireUser } from "@/lib/auth/session";
import { getAuctionableArticles } from "@/lib/queries/auctions";
import { CreateAuctionForm } from "@/components/auction/create-auction-form";

export const metadata = { title: "Lancer une enchère" };

export default async function NewAuctionPage() {
  const user = await requireUser();
  const articles = await getAuctionableArticles(user.authId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Lancer une enchère</h1>
      <p className="mt-1 mb-8 text-sm text-muted">
        Choisis un de tes articles et fixe les règles de l&apos;enchère.
      </p>
      <CreateAuctionForm articles={articles} />
    </main>
  );
}
