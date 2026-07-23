import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyBoutiques } from "@/lib/queries/boutiques";
import { ProfileForm } from "@/components/profile/profile-form";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Mon profil" };

const ROLE_LABELS: Record<string, string> = {
  particulier: "Particulier",
  createur: "Créateur",
  boutique: "Boutique",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  pending_kyc: "Vérification en attente",
  suspended: "Suspendu",
};

export default async function ProfilePage() {
  const { authId, email, account, profile } = await requireUser();
  const boutiques = await getMyBoutiques(authId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar_url} name={profile.display_name} size={56} />
          <div>
            <h1 className="text-2xl font-semibold">{profile.display_name ?? "Mon profil"}</h1>
            <p className="text-sm text-muted">
              {account.username ? `@${account.username}` : email}
            </p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <Card className="mt-8">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Type de compte</dt>
            <dd className="mt-0.5 font-medium">{ROLE_LABELS[account.role] ?? account.role}</dd>
          </div>
          <div>
            <dt className="text-muted">Statut</dt>
            <dd className="mt-0.5 font-medium">{STATUS_LABELS[account.status] ?? account.status}</dd>
          </div>
          <div>
            <dt className="text-muted">E-mail</dt>
            <dd className="mt-0.5 font-medium break-all">{email}</dd>
          </div>
          <div>
            <dt className="text-muted">Identité vérifiée (KYC)</dt>
            <dd className="mt-0.5 font-medium">{account.kyc_verified ? "Oui" : "Non"}</dd>
          </div>
        </dl>

        {account.username && (
          <p className="mt-4 text-sm text-muted">
            Profil public :{" "}
            <Link
              href={`/u/${account.username}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              /u/{account.username}
            </Link>
          </p>
        )}
      </Card>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mes boutiques</h2>
          <Link href="/boutiques/new">
            <Button variant="outline" size="sm">Créer une boutique</Button>
          </Link>
        </div>
        {boutiques.length === 0 ? (
          <p className="text-sm text-muted">Tu n&apos;as pas encore de boutique.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {boutiques.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <Link href={`/boutique/${b.handle}`} className="font-medium hover:underline">
                    {b.name}
                  </Link>
                  <p className="text-xs text-muted">@{b.handle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={b.role === "owner" ? "info" : "neutral"}>
                    {b.role === "owner" ? "Propriétaire" : "Manager"}
                  </Badge>
                  <Link href={`/boutique/${b.handle}/manage`} className="text-sm underline underline-offset-4">
                    Gérer
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Éditer mon profil</h2>
        <ProfileForm
          values={{
            username: account.username,
            displayName: profile.display_name,
            bio: profile.bio,
            location: profile.location,
            websiteUrl: profile.website_url,
          }}
        />
      </section>
    </main>
  );
}
