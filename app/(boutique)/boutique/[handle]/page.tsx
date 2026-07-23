import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoutiqueByHandle, getBoutiqueMembers } from "@/lib/queries/boutiques";
import { getSessionUser } from "@/lib/auth/session";
import { BoutiqueHeader } from "@/components/boutique/boutique-header";
import { Avatar } from "@/components/ui/avatar";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const boutique = await getBoutiqueByHandle(handle);
  return { title: boutique?.name ?? "Boutique introuvable" };
}

export default async function BoutiquePage({ params }: Props) {
  const { handle } = await params;
  const boutique = await getBoutiqueByHandle(handle);
  if (!boutique) notFound();

  const [members, viewer] = await Promise.all([
    getBoutiqueMembers(boutique.id),
    getSessionUser(),
  ]);
  const isMember = members.some((m) => m.user_id === viewer?.authId);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <BoutiqueHeader boutique={boutique} showStatus={isMember} />
        {isMember && (
          <Link href={`/boutique/${handle}/manage`} className="shrink-0 text-sm underline underline-offset-4">
            Gérer
          </Link>
        )}
      </div>

      {members.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {members.map((m) => (
            <span key={m.user_id} className="inline-flex items-center gap-2 text-sm text-muted">
              <Avatar src={m.profile?.avatar_url} name={m.profile?.display_name} size={24} />
              {m.profile?.username ? (
                <Link href={`/u/${m.profile.username}`} className="hover:underline">
                  {m.profile.display_name ?? m.profile.username}
                </Link>
              ) : (
                m.profile?.display_name ?? "Membre"
              )}
            </span>
          ))}
        </div>
      )}
    </main>
  );
}
