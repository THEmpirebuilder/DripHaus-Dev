import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/social/follow-button";
import type { BoutiquePublic } from "@/lib/queries/boutiques";

const TRENDS = ["Seconde main", "Denim vintage", "Slow fashion", "Créateurs suisses", "Upcyclé"];

/** Rail latéral du feed : boutiques à suivre + tendances. Présentation. */
export function FeedRail({ boutiques, canFollow }: { boutiques: BoutiquePublic[]; canFollow: boolean }) {
  return (
    <div className="space-y-5 lg:sticky lg:top-6">
      <section className="border border-border bg-surface p-4">
        <div className="u-label mb-4 text-[10px] text-accent">À suivre</div>
        <ul className="space-y-4">
          {boutiques.slice(0, 4).map((b) => (
            <li key={b.id} className="flex items-center gap-3">
              <Link href={`/boutique/${b.handle}`} className="shrink-0">
                <Avatar src={b.logo_url} name={b.name} size={40} className="rounded-full ring-1 ring-border" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/boutique/${b.handle}`} className="block truncate text-[13px] font-semibold hover:text-accent">{b.name}</Link>
                <p className="truncate text-[11px] text-muted">@{b.handle}</p>
              </div>
              {canFollow ? (
                <FollowButton target={{ boutiqueId: b.id }} initialFollowing={false} />
              ) : (
                <Link href={`/boutique/${b.handle}`}>
                  <Button variant="outline" size="sm">Voir</Button>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-border bg-surface p-4">
        <div className="u-label mb-4 text-[10px] text-accent">Tendances</div>
        <div className="flex flex-wrap gap-2">
          {TRENDS.map((t) => (
            <Link
              key={t}
              href={`/marketplace?q=${encodeURIComponent(t)}`}
              className="u-label rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-[9.5px] text-foreground transition-colors hover:border-accent/50 hover:text-accent"
            >
              {t}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
