import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Monogram } from "@/components/brand/monogram";
import { ArticleGrid } from "@/components/article/article-grid";
import { BoutiqueCard } from "@/components/boutique/boutique-card";
import { listArticles } from "@/lib/queries/articles";
import { getSuggestedBoutiques } from "@/lib/queries/boutiques";

const modules = [
  { href: "/marketplace", label: "Marketplace", desc: "Les pièces en vente, authentifiées pièce par pièce." },
  { href: "/feed", label: "Feed", desc: "L'activité des boutiques et de la communauté." },
  { href: "/auctions", label: "Enchères", desc: "Les ventes aux enchères en cours." },
  { href: "/studio", label: "Studio IA", desc: "Créer visuels et descriptions produit." },
];

function ArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform duration-200 group-hover:translate-x-1" aria-hidden>
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" />
    </svg>
  );
}

export default async function HomePage() {
  const [{ items: selection }, boutiques] = await Promise.all([
    listArticles({ pageSize: 8 }),
    getSuggestedBoutiques(3),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="border-b border-border py-24 text-center">
        <div className="flex justify-center">
          <Monogram size={64} />
        </div>
        <p className="u-label mt-8 text-[11px] text-accent">La mode indépendante suisse</p>
        <h1 className="font-serif mx-auto mt-4 max-w-3xl text-6xl leading-[1.05] tracking-[0.02em]">
          Seconde main, vintage et créateurs — authentifiés pièce par pièce.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted">
          Une maison numérique pour les boutiques et les vendeurs indépendants de Suisse romande.
          Marketplace, feed, enchères et vitrines de marque.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3">
          <Link href="/marketplace">
            <Button>Explorer la marketplace</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline">Créer un compte</Button>
          </Link>
        </div>
      </section>

      {/* Sélection du moment */}
      {selection.length > 0 && (
        <section className="py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="u-label mb-1.5 text-[11px] text-accent">Sélection du moment</div>
              <h2 className="font-serif text-3xl leading-none">Pièces à découvrir</h2>
            </div>
            <Link href="/marketplace" className="group inline-flex items-center gap-2 text-sm text-accent hover:text-gold-shadow">
              Tout voir <ArrowRight />
            </Link>
          </div>
          <ArticleGrid articles={selection} emptyLabel="Rien pour le moment." />
        </section>
      )}

      {/* Boutiques à la une */}
      {boutiques.length > 0 && (
        <section className="border-t border-border py-16">
          <div className="mb-8">
            <div className="u-label mb-1.5 text-[11px] text-accent">Maisons partenaires</div>
            <h2 className="font-serif text-3xl leading-none">Boutiques à la une</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boutiques.map((b) => (
              <BoutiqueCard key={b.id} boutique={b} />
            ))}
          </div>
        </section>
      )}

      {/* Modules */}
      <section className="grid gap-px border-t border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group flex min-h-44 flex-col justify-between bg-surface p-7 transition-colors hover:bg-surface-elevated"
          >
            <span className="u-label text-[11px] text-accent">{m.label}</span>
            <span className="mt-6 flex items-end justify-between">
              <span className="max-w-[16rem] text-sm leading-relaxed text-muted">{m.desc}</span>
              <span className="text-foreground"><ArrowRight /></span>
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
