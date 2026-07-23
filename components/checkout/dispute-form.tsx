"use client";

import { useActionState } from "react";
import { openDisputeAction, type DisputeFormState } from "@/lib/actions/disputes";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: DisputeFormState = {};

const REASONS = [
  { value: "not_received", label: "Article non reçu" },
  { value: "not_as_described", label: "Non conforme à la description" },
  { value: "damaged", label: "Article endommagé" },
  { value: "other", label: "Autre" },
];

export function DisputeForm({ transactionId }: { transactionId: string }) {
  const [state, formAction] = useActionState(openDisputeAction, initial);

  if (state.success) {
    return <Alert tone="success">Litige ouvert. Notre équipe va l&apos;examiner.</Alert>;
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="transaction_id" value={transactionId} />
      <div>
        <Label htmlFor="reason">Motif</Label>
        <Select id="reason" name="reason" required>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Détails</Label>
        <Textarea id="description" name="description" placeholder="Décris le problème…" />
      </div>
      <SubmitButton variant="destructive" size="sm" pendingLabel="Envoi…">
        Ouvrir un litige
      </SubmitButton>
    </form>
  );
}
