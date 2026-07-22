import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Marketplace" };
export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const supabase = await createClient();

  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, title, brand, price, currency, condition, images")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(24);

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>

      {error && <p className="mt-6 text-sm text-red-600">{error.message}</p>}

      {!error && articles?.length === 0 && (
        <p className="mt-6 opacity-60">Aucun article en vente pour le moment.</p>
      )}

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles?.map((a) => (
          <li key={a.id} className="rounded-lg border border-black/10 p-4 dark:border-white/15">
            <p className="font-medium">{a.title}</p>
            {a.brand && <p className="text-sm opacity-60">{a.brand}</p>}
            <p className="mt-2 text-sm">
              {a.price} {a.currency}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
