import Link from "next/link";
import type { Category } from "@/lib/queries/categories";

/**
 * Boutons de navigation par famille (haut de la marketplace). La famille active
 * est mise en avant (bordure + fond accent). Cliquer une famille active la
 * désélectionne (retour au catalogue complet).
 */
export function CategoryTiles({
  categories,
  activeId,
}: {
  categories: Category[];
  activeId?: string | null;
}) {
  if (categories.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((c) => {
        const active = c.id === activeId;
        return (
          <Link
            key={c.id}
            href={active ? "/marketplace" : `/marketplace?category=${c.id}`}
            aria-current={active ? "true" : undefined}
            className={`group flex items-center justify-between gap-2 border px-4 py-4 transition-colors ${
              active
                ? "border-accent bg-accent/10"
                : "border-border bg-surface-elevated hover:border-accent/50"
            }`}
          >
            <span className="font-serif text-base leading-tight">{c.name}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform duration-200 ${active ? "" : "group-hover:translate-x-1"}`} aria-hidden>
              {active ? <polyline points="20 6 9 17 4 12" /> : <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></>}
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
