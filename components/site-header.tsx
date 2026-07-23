import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getUnreadCount } from "@/lib/queries/notifications";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/**
 * En-tête global. Server Component : lit la session et adapte l'affichage
 * (connexion vs profil). Orchestration uniquement — pas de logique métier.
 */
export async function SiteHeader() {
  const user = await getSessionUser();
  const unread = user ? await getUnreadCount(user.authId) : 0;

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            DripHaus
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-muted sm:flex">
            <Link href="/marketplace" className="hover:text-foreground">Marketplace</Link>
            <Link href="/feed" className="hover:text-foreground">Feed</Link>
            <Link href="/auctions" className="hover:text-foreground">Enchères</Link>
          </nav>
        </div>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/studio" className="hidden text-sm font-medium sm:inline">
                Studio
              </Link>
              <Link href="/articles/new" className="text-sm font-medium">
                Vendre
              </Link>
              <Link href="/notifications" className="relative text-sm" aria-label="Notifications">
                <span aria-hidden>🔔</span>
                {unread > 0 && (
                  <span className="absolute -right-2 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="flex items-center gap-2 text-sm font-medium">
                <Avatar src={user.profile.avatar_url} name={user.profile.display_name} size={32} />
                <span className="hidden sm:inline">{user.profile.display_name ?? "Mon profil"}</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium">
                Connexion
              </Link>
              <Link href="/signup">
                <Button size="sm">Créer un compte</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
