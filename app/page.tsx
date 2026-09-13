import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Monogram } from "@/components/brand/monogram";

const modules = [
  { href: "/marketplace", label: "Marketplace", desc: "Les pièces en vente, authentifiées pièce par pièce." },
  { href: "/feed", label: "Feed", desc: "L'activité des boutiques et de la communauté." },
  { href: "/auctions", label: "Enchères", desc: "Les ventes aux enchères en cours." },
  { href: "/studio", label: "Studio IA", desc: "Créer visuels et descriptions produit." },
];

export default function HomePage() {
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

      {/* Modules */}
      <section className="grid gap-px bg-border py-px sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group flex min-h-44 flex-col justify-between bg-surface p-7 transition-colors hover:bg-surface-elevated"
          >
            <span className="u-label text-[11px] text-accent">{m.label}</span>
            <span className="mt-6 flex items-end justify-between">
              <span className="max-w-[16rem] text-sm leading-relaxed text-muted">{m.desc}</span>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-foreground transition-transform group-hover:translate-x-1"
                aria-hidden
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
