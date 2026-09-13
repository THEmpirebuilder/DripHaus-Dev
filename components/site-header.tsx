import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { getUnreadCount } from "@/lib/queries/notifications";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/monogram";

const NAV = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/feed", label: "Feed" },
  { href: "/auctions", label: "Enchères" },
  { href: "/boutiques", label: "Boutiques" },
];

/**
 * En-tête global. Server Component : lit la session et adapte l'affichage
 * (connexion vs profil). Orchestration uniquement — pas de logique métier.
 */
export async function SiteHeader() {
  const user = await getSessionUser();
  const unread = user ? await getUnreadCount(user.authId) : 0;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-9">
          <Link href="/" aria-label="DripHaus — accueil">
            <Logo size={32} />
          </Link>
          <nav className="hidden items-center gap-7 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="u-label text-[11px] text-foreground transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/studio" className="u-label hidden text-[11px] text-foreground hover:text-accent sm:inline">
                Studio
              </Link>
              <Link
                href="/notifications"
                className="relative inline-flex text-muted transition-colors hover:text-foreground"
                aria-label="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -right-2 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link href="/articles/new">
                <Button size="sm">Vendre</Button>
              </Link>
              <Link href="/profile" className="flex items-center gap-2" aria-label="Mon profil">
                <Avatar src={user.profile.avatar_url} name={user.profile.display_name} size={32} />
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="u-label text-[11px] text-foreground hover:text-accent">
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
