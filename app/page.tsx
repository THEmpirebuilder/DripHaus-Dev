import Link from "next/link";

const modules = [
  { href: "/marketplace", label: "Marketplace", desc: "Tous les articles en vente" },
  { href: "/feed", label: "Feed", desc: "L'activité de la communauté" },
  { href: "/auctions", label: "Enchères", desc: "Les ventes en cours" },
  { href: "/studio", label: "Studio IA", desc: "Créer et publier du contenu" },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">DripHaus</h1>
      <p className="mt-4 text-lg opacity-70">
        La plateforme suisse des boutiques et vendeurs mode indépendants.
      </p>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {modules.map((m) => (
          <li key={m.href}>
            <Link
              href={m.href}
              className="block rounded-lg border border-black/10 p-5 transition hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
            >
              <span className="font-medium">{m.label}</span>
              <span className="mt-1 block text-sm opacity-60">{m.desc}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
