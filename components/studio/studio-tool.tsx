"use client";

import { useActionState } from "react";
import { runStudioAction, type StudioFormState } from "@/lib/actions/studio";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: StudioFormState = {};

const TOOLS = [
  { value: "product", label: "Description produit", hint: "Transforme des caractéristiques en texte de vente." },
  { value: "caption", label: "Légende de post", hint: "Une légende + hashtags pour le feed." },
  { value: "seo", label: "Titre & meta SEO", hint: "Optimise le référencement de ton annonce." },
];

export function StudioTool() {
  const [state, formAction] = useActionState(runStudioAction, initial);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="tool">Outil</Label>
            <Select id="tool" name="tool" defaultValue={state.tool ?? "product"}>
              {TOOLS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="input">Ton article</Label>
            <Textarea
              id="input"
              name="input"
              className="min-h-40"
              placeholder="Ex. Veste en jean Levi's vintage, taille M, très bon état, coupe oversize, années 90…"
              required
            />
          </div>

          <SubmitButton pendingLabel="Génération…">Générer</SubmitButton>
        </form>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-medium">Résultat</p>
        {state.error && <Alert tone="error">{state.error}</Alert>}
        {state.output ? (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{state.output}</pre>
        ) : (
          !state.error && <p className="text-sm text-muted">Le contenu généré s&apos;affichera ici.</p>
        )}
      </Card>
    </div>
  );
}
