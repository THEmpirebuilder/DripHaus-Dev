import Link from "next/link";
import type { Category } from "@/lib/queries/categories";

/** Tuiles de navigation visuelle par famille (haut de la marketplace). */
export function CategoryTiles({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/marketplace?category=${c.id}`}
          className="group flex items-center justify-between gap-2 border border-border bg-surface-elevated px-4 py-4 transition-colors hover:border-accent/50"
        >
          <span className="font-serif text-base leading-tight">{c.name}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden>
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" />
          </svg>
        </Link>
      ))}
    </div>
  );
}
