import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { BoutiquePublic } from "@/lib/queries/boutiques";

/** Bandeau horizontal « Nouveautés » — avatars des boutiques, anneau or, façon stories. */
export function StoryRail({ boutiques }: { boutiques: BoutiquePublic[] }) {
  if (boutiques.length === 0) return null;
  return (
    <section aria-label="Nouveautés des boutiques">
      <div className="u-label mb-3 text-[10px] text-accent">Nouveautés</div>
      <div className="flex gap-5 overflow-x-auto pb-1">
        {boutiques.map((b) => (
          <Link key={b.id} href={`/boutique/${b.handle}`} className="flex w-[68px] shrink-0 flex-col items-center gap-2 text-center">
            <span className="rounded-full bg-gradient-to-br from-gold via-gold-reflect to-bronze p-[2px] transition-transform duration-200 hover:scale-105">
              <span className="block rounded-full bg-background p-[3px]">
                <Avatar src={b.logo_url} name={b.name} size={54} className="rounded-full" />
              </span>
            </span>
            <span className="w-full truncate text-[11px] text-muted">{b.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
