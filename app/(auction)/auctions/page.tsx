import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Enchères" };
export const dynamic = "force-dynamic";

export default async function AuctionsPage() {
  const supabase = await createClient();

  const { data: auctions, error } = await supabase
    .from("auctions")
    .select("id, starting_price, current_price, ends_at, status, articles(title, brand)")
    .eq("status", "active")
    .order("ends_at", { ascending: true })
    .limit(24);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Enchères en cours</h1>

      {error && <p className="mt-6 text-sm text-red-600">{error.message}</p>}

      {!error && auctions?.length === 0 && (
        <p className="mt-6 opacity-60">Aucune enchère active.</p>
      )}

      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {auctions?.map((a) => (
          <li key={a.id} className="rounded-lg border border-black/10 p-5 dark:border-white/15">
            <p className="font-medium">{a.articles?.title ?? "Article"}</p>
            <p className="mt-2 text-sm">
              {a.current_price ?? a.starting_price} CHF
            </p>
            <p className="mt-1 text-xs opacity-50">
              Fin : {new Date(a.ends_at).toLocaleString("fr-CH")}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
