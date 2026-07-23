"use client";

import { useActionState } from "react";
import { createAuctionAction, type AuctionFormState } from "@/lib/actions/auctions";
import type { Tables } from "@/types/database";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { EmptyState } from "@/components/ui/empty-state";

const initial: AuctionFormState = {};

export function CreateAuctionForm({ articles }: { articles: Tables<"articles">[] }) {
  const [state, formAction] = useActionState(createAuctionAction, initial);

  if (articles.length === 0) {
    return (
      <EmptyState
        title="Aucun article éligible"
        description="Publie d'abord un article (actif, pas déjà en enchère) pour le mettre aux enchères."
      />
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <div>
        <Label htmlFor="article_id">Article</Label>
        <Select id="article_id" name="article_id" required>
          {articles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="starting_price">Prix de départ (CHF)</Label>
          <Input id="starting_price" name="starting_price" type="number" step="0.05" min="0.05" required />
        </div>
        <div>
          <Label htmlFor="bid_increment">Incrément (CHF)</Label>
          <Input id="bid_increment" name="bid_increment" type="number" step="0.05" min="0.05" defaultValue="1" required />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="reserve_price">Prix de réserve (optionnel)</Label>
          <Input id="reserve_price" name="reserve_price" type="number" step="0.05" min="0" placeholder="—" />
        </div>
        <div>
          <Label htmlFor="duration_days">Durée</Label>
          <Select id="duration_days" name="duration_days" defaultValue="7">
            <option value="1">1 jour</option>
            <option value="3">3 jours</option>
            <option value="5">5 jours</option>
            <option value="7">7 jours</option>
            <option value="14">14 jours</option>
          </Select>
        </div>
      </div>

      <SubmitButton pendingLabel="Lancement…">Lancer l&apos;enchère</SubmitButton>
    </form>
  );
}
