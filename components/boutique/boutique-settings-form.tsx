"use client";

import { useActionState } from "react";
import { updateBoutiqueAction, type BoutiqueFormState } from "@/lib/actions/boutiques";
import type { Tables } from "@/types/database";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: BoutiqueFormState = {};

export function BoutiqueSettingsForm({ boutique }: { boutique: Tables<"boutiques"> }) {
  const [state, formAction] = useActionState(updateBoutiqueAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.success && <Alert tone="success">Boutique mise à jour.</Alert>}

      <input type="hidden" name="boutique_id" value={boutique.id} />
      <input type="hidden" name="handle" value={boutique.handle} />

      <div>
        <Label htmlFor="name">Nom</Label>
        <Input id="name" name="name" defaultValue={boutique.name} required />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={boutique.description ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="email_contact">E-mail de contact</Label>
          <Input id="email_contact" name="email_contact" type="email" defaultValue={boutique.email_contact ?? ""} />
        </div>
        <div>
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" defaultValue={boutique.phone ?? ""} />
        </div>
      </div>

      <div>
        <Label htmlFor="website_url">Site web</Label>
        <Input id="website_url" name="website_url" type="url" defaultValue={boutique.website_url ?? ""} placeholder="https://…" />
      </div>

      <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}
