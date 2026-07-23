"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileFormState } from "@/lib/actions/profile";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: ProfileFormState = {};

export type ProfileFormValues = {
  username: string | null;
  displayName: string | null;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
};

export function ProfileForm({ values }: { values: ProfileFormValues }) {
  const [state, formAction] = useActionState(updateProfileAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.success && <Alert tone="success">Profil mis à jour.</Alert>}

      <div>
        <Label htmlFor="username">Nom d&apos;utilisateur</Label>
        <Input
          id="username"
          name="username"
          defaultValue={values.username ?? ""}
          placeholder="ton_pseudo"
          autoCapitalize="none"
          spellCheck={false}
        />
        <p className="mt-1 text-xs text-muted">
          3 à 30 caractères : minuscules, chiffres ou « _ ». Sert d&apos;URL publique.
        </p>
      </div>

      <div>
        <Label htmlFor="display_name">Nom affiché</Label>
        <Input id="display_name" name="display_name" defaultValue={values.displayName ?? ""} />
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={values.bio ?? ""} placeholder="Quelques mots sur toi ou ta boutique" />
      </div>

      <div>
        <Label htmlFor="location">Localisation</Label>
        <Input id="location" name="location" defaultValue={values.location ?? ""} placeholder="Lausanne, VD" />
      </div>

      <div>
        <Label htmlFor="website_url">Site web</Label>
        <Input
          id="website_url"
          name="website_url"
          type="url"
          defaultValue={values.websiteUrl ?? ""}
          placeholder="https://…"
        />
      </div>

      <SubmitButton pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
    </form>
  );
}
