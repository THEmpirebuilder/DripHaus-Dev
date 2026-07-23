"use client";

import { useActionState } from "react";
import { createReviewAction, type ReviewFormState } from "@/lib/actions/reviews";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: ReviewFormState = {};

export function ReviewForm({ transactionId }: { transactionId: string }) {
  const [state, formAction] = useActionState(createReviewAction, initial);

  if (state.success) {
    return <Alert tone="success">Merci pour ton avis !</Alert>;
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <input type="hidden" name="transaction_id" value={transactionId} />
      <div>
        <Label htmlFor="rating">Note</Label>
        <Select id="rating" name="rating" defaultValue="5">
          <option value="5">★★★★★ — Excellent</option>
          <option value="4">★★★★ — Très bien</option>
          <option value="3">★★★ — Correct</option>
          <option value="2">★★ — Décevant</option>
          <option value="1">★ — Mauvais</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="comment">Commentaire</Label>
        <Textarea id="comment" name="comment" placeholder="Ton retour sur cette transaction…" />
      </div>
      <SubmitButton size="sm" pendingLabel="Envoi…">Laisser un avis</SubmitButton>
    </form>
  );
}
