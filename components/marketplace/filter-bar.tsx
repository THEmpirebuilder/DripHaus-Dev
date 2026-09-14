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

const GENDERS = [
  { value: "", label: "Tous genres" },
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "fille", label: "Fille" },
  { value: "garcon", label: "Garçon" },
  { value: "unisexe", label: "Unisexe" },
  { value: "bebe", label: "Bébé" },
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

  // Sélecteur catégorie en CASCADE : Famille -> Macro -> Micro. Le param d'URL
  // `category` porte le niveau le plus profond choisi ; on remonte ses parents
  // pour pré-remplir les selects. Chaque niveau ne s'affiche que si le parent
  // est choisi. Vider un niveau retombe sur son parent (et non « tout »).
  const childrenOf = (parentId: string | null) =>
    categories.filter((c) => (c.parent_id ?? null) === parentId);

  const current = params.get("category") ?? "";
  const node = categories.find((c) => c.id === current) ?? null;
  const parent = node?.parent_id ? categories.find((c) => c.id === node.parent_id) ?? null : null;
  const grandParent = parent?.parent_id
    ? categories.find((c) => c.id === parent.parent_id) ?? null
    : null;

  // Résolution des 3 niveaux à partir du nœud courant (famille/macro/micro).
  let familyId = "";
  let macroId = "";
  let microId = "";
  if (node) {
    if (!node.parent_id) familyId = node.id;
    else if (parent && !parent.parent_id) {
      macroId = node.id;
      familyId = parent.id;
    } else if (parent && grandParent) {
      microId = node.id;
      macroId = parent.id;
      familyId = grandParent.id;
    }
  }

  const families = childrenOf(null);
  const macros = familyId ? childrenOf(familyId) : [];
  const micros = macroId ? childrenOf(macroId) : [];

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
        value={familyId}
        onChange={(e) => update("category", e.target.value)}
        aria-label="Famille"
      >
        <option value="">Toutes familles</option>
        {families.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      {familyId && (
        <Select
          value={macroId}
          onChange={(e) => update("category", e.target.value || familyId)}
          aria-label="Catégorie"
        >
          <option value="">Toutes catégories</option>
          {macros.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      )}
      {macroId && micros.length > 0 && (
        <Select
          value={microId}
          onChange={(e) => update("category", e.target.value || macroId)}
          aria-label="Type"
        >
          <option value="">Tous les types</option>
          {micros.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      )}
      <Select
        value={params.get("genre") ?? ""}
        onChange={(e) => update("genre", e.target.value)}
        aria-label="Genre"
      >
        {GENDERS.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
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
