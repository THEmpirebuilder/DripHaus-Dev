"use client";

import { useActionState } from "react";
import { createBoutiqueAction, type BoutiqueFormState } from "@/lib/actions/boutiques";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: BoutiqueFormState = {};

export function CreateBoutiqueForm() {
  const [state, formAction] = useActionState(createBoutiqueAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div>
        <Label htmlFor="name">Nom de la boutique</Label>
        <Input id="name" name="name" required placeholder="Atelier Léman" />
      </div>

      <div>
        <Label htmlFor="handle">Handle (URL)</Label>
        <Input id="handle" name="handle" required placeholder="atelier-leman" autoCapitalize="none" spellCheck={false} />
        <p className="mt-1 text-xs text-muted">3 à 40 caractères : minuscules, chiffres ou « - ». Ex. driphaus.ch/boutique/atelier-leman</p>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" placeholder="Ce que vend ta boutique, ton univers…" />
      </div>

      <SubmitButton pendingLabel="Création…">Créer la boutique</SubmitButton>
      <p className="text-xs text-muted">
        Ta boutique sera « en attente » jusqu&apos;à la vérification (KYC) avant d&apos;être visible publiquement.
      </p>
    </form>
  );
}
