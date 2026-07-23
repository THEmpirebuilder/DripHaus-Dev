import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getBoutiqueByHandle, getBoutiqueMembers } from "@/lib/queries/boutiques";
import { requireUser } from "@/lib/auth/session";
import { BoutiqueSettingsForm } from "@/components/boutique/boutique-settings-form";
import { MemberManager } from "@/components/boutique/member-manager";
import { Card } from "@/components/ui/card";

type Props = { params: Promise<{ handle: string }> };

export const metadata = { title: "Gérer la boutique" };

export default async function ManageBoutiquePage({ params }: Props) {
  const { handle } = await params;
  const user = await requireUser();
  const boutique = await getBoutiqueByHandle(handle);
  if (!boutique) notFound();

  const members = await getBoutiqueMembers(boutique.id);
  const me = members.find((m) => m.user_id === user.authId);
  if (!me) redirect(`/boutique/${handle}`); // non-membre

  const isOwner = me.role === "owner";

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gérer « {boutique.name} »</h1>
        <Link href={`/boutique/${handle}`} className="text-sm underline underline-offset-4">
          Voir la page publique
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Informations</h2>
        <Card>
          <BoutiqueSettingsForm boutique={boutique} />
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Membres</h2>
        <MemberManager
          boutiqueId={boutique.id}
          handle={handle}
          members={members}
          isOwner={isOwner}
          currentUserId={user.authId}
        />
      </section>
    </main>
  );
}
