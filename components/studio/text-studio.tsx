"use client";

import { useActionState } from "react";
import { runStudioAction, type StudioFormState } from "@/lib/actions/studio";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

/**
 * Studio Texte (famille G) — la seule famille CÂBLÉE aujourd'hui : caption / SEO /
 * description via l'AI Gateway (`lib/ai/studio.ts`). Vit dans le dock du workstation.
 * Logique déportée dans la Server Action `runStudioAction`.
 */
const initial: StudioFormState = {};

const TOOLS = [
  { value: "product", label: "Description produit" },
  { value: "caption", label: "Légende de post" },
  { value: "seo", label: "Titre & meta SEO" },
];

export function TextStudio() {
  const [state, formAction] = useActionState(runStudioAction, initial);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <div>
          <Label htmlFor="tool">Outil texte</Label>
          <Select id="tool" name="tool" defaultValue={state.tool ?? "product"}>
            {TOOLS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="input">Ta pièce</Label>
          <Textarea
            id="input"
            name="input"
            className="min-h-28"
            placeholder="Ex. Veste en jean Levi's vintage, taille M, très bon état, coupe oversize, années 90…"
            required
          />
        </div>

        <SubmitButton pendingLabel="Génération…" className="w-full">
          Générer
        </SubmitButton>
      </form>

      <div>
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.output ? (
          <div className="border border-border bg-surface-elevated p-3">
            <p className="u-label mb-2 text-[9px] text-muted">Résultat</p>
            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">{state.output}</pre>
          </div>
        ) : (
          !state.error && (
            <p className="text-[12px] text-muted">
              Le texte généré s&apos;affichera ici. Cette famille est déjà active.
            </p>
          )
        )}
      </div>
    </div>
  );
}
