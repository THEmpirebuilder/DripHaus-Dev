"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { Category } from "@/lib/queries/categories";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const CONDITIONS = [
  { value: "", label: "Tous les états" },
  { value: "new", label: "Neuf" },
  { value: "very_good", label: "Très bon état" },
  { value: "good", label: "Bon état" },
  { value: "fair", label: "État correct" },
];

const SORTS = [
  { value: "recent", label: "Plus récents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

/**
 * Barre de filtres pilotée par l'URL (searchParams). Modifier un filtre
 * réinitialise la pagination. Présentation + navigation, pas de logique data.
 */
export function FilterBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete("page"); // tout changement de filtre repart page 0
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        placeholder="Rechercher…"
        defaultValue={params.get("q") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") update("q", (e.target as HTMLInputElement).value.trim());
        }}
        aria-label="Rechercher"
      />
      <Select
        value={params.get("category") ?? ""}
        onChange={(e) => update("category", e.target.value)}
        aria-label="Catégorie"
      >
        <option value="">Toutes catégories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Select
        value={params.get("condition") ?? ""}
        onChange={(e) => update("condition", e.target.value)}
        aria-label="État"
      >
        {CONDITIONS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </Select>
      <Select
        value={params.get("sort") ?? "recent"}
        onChange={(e) => update("sort", e.target.value)}
        aria-label="Trier"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
