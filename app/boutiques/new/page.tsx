import { requireUser } from "@/lib/auth/session";
import { CreateBoutiqueForm } from "@/components/boutique/create-boutique-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Créer une boutique" };

export default async function NewBoutiquePage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-semibold">Créer une boutique</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Une vitrine dédiée pour vendre sous ta marque ou ton enseigne.
      </p>
      <Card>
        <CreateBoutiqueForm />
      </Card>
    </main>
  );
}
