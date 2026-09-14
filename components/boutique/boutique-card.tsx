import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { BoutiquePublic } from "@/lib/queries/boutiques";

/** Carte boutique compacte (accueil, listes). Présentation pure. */
export function BoutiqueCard({ boutique }: { boutique: BoutiquePublic }) {
  return (
    <Link
      href={`/boutique/${boutique.handle}`}
      className="group flex flex-col border border-border bg-surface p-5 transition-shadow duration-200 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <Avatar src={boutique.logo_url} name={boutique.name} size={48} className="rounded-none ring-1 ring-accent/30" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-serif truncate text-lg leading-tight">{boutique.name}</span>
            {boutique.kyc_verified && <span aria-hidden className="inline-block h-2 w-2 rotate-45 border border-silver" />}
          </div>
          <span className="text-xs text-muted">@{boutique.handle}</span>
        </div>
      </div>
      {boutique.description && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{boutique.description}</p>
      )}
      <span className="u-label mt-4 inline-flex items-center gap-1.5 text-[10px] text-accent">
        Voir la boutique
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden>
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" />
        </svg>
      </span>
    </Link>
  );
}
