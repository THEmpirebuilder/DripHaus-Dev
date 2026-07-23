"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthFormState } from "@/lib/actions/auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: AuthFormState = {};

const ROLE_OPTIONS = [
  { value: "particulier", label: "Particulier — vendre & acheter" },
  { value: "createur", label: "Créateur — ma marque indépendante" },
  { value: "boutique", label: "Boutique — multimarque / seconde main" },
];

export function SignupForm() {
  const [state, formAction] = useActionState(signUpAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.message && <Alert tone="success">{state.message}</Alert>}

      <div>
        <Label htmlFor="display_name">Nom affiché</Label>
        <Input id="display_name" name="display_name" autoComplete="name" placeholder="Ton nom ou celui de ta boutique" />
      </div>

      <div>
        <Label htmlFor="role">Type de compte</Label>
        <Select id="role" name="role" defaultValue="particulier">
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="toi@exemple.ch" />
      </div>

      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8 caractères minimum"
        />
      </div>

      <SubmitButton className="w-full" pendingLabel="Création…">
        Créer mon compte
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
