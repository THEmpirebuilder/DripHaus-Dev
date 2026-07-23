"use client";

import { useActionState } from "react";
import { placeBidAction, type BidFormState } from "@/lib/actions/auctions";
import { formatMoney } from "@/lib/utils/format";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: BidFormState = {};

export function BidForm({
  auctionId,
  minNextBid,
  currency = "CHF",
}: {
  auctionId: string;
  minNextBid: number;
  currency?: string;
}) {
  const [state, formAction] = useActionState(placeBidAction, initial);

  return (
    <form action={formAction} className="space-y-3">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {state.success && <Alert tone="success">Offre enregistrée !</Alert>}

      <input type="hidden" name="auction_id" value={auctionId} />
      <div>
        <Label htmlFor="amount">Ton offre ({currency})</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.05"
          min={minNextBid}
          defaultValue={minNextBid}
          required
        />
        <p className="mt-1 text-xs text-muted">Minimum : {formatMoney(minNextBid, currency)}</p>
      </div>
      <SubmitButton className="w-full" pendingLabel="Envoi…">Enchérir</SubmitButton>
    </form>
  );
}
