import { requireUser } from "@/lib/auth/session";
import { getMyPurchases, getMySales } from "@/lib/queries/transactions";
import { TransactionCard } from "@/components/checkout/transaction-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Mes commandes" };

export default async function OrdersPage() {
  const user = await requireUser();
  const [purchases, sales] = await Promise.all([
    getMyPurchases(user.authId),
    getMySales(user.authId),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Mes commandes</h1>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Achats</h2>
        {purchases.length === 0 ? (
          <EmptyState title="Aucun achat pour le moment." />
        ) : (
          <div className="space-y-3">
            {purchases.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">Ventes</h2>
        {sales.length === 0 ? (
          <EmptyState title="Aucune vente pour le moment." />
        ) : (
          <div className="space-y-3">
            {sales.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
