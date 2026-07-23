"use client";

import { useActionState } from "react";
import { addMemberAction, removeMemberAction, type MemberFormState } from "@/lib/actions/boutiques";
import type { BoutiqueMember } from "@/lib/queries/boutiques";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: MemberFormState = {};

export function MemberManager({
  boutiqueId,
  handle,
  members,
  isOwner,
  currentUserId,
}: {
  boutiqueId: string;
  handle: string;
  members: BoutiqueMember[];
  isOwner: boolean;
  currentUserId: string;
}) {
  const [state, formAction] = useActionState(addMemberAction, initial);

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-border rounded-xl border border-border">
        {members.map((m) => (
          <li key={m.user_id} className="flex items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-3">
              <Avatar src={m.profile?.avatar_url} name={m.profile?.display_name} size={36} />
              <div>
                <p className="text-sm font-medium">{m.profile?.display_name ?? m.profile?.username ?? "Membre"}</p>
                {m.profile?.username && <p className="text-xs text-muted">@{m.profile.username}</p>}
              </div>
              <Badge tone={m.role === "owner" ? "info" : "neutral"}>
                {m.role === "owner" ? "Propriétaire" : "Manager"}
              </Badge>
            </div>

            {(isOwner || m.user_id === currentUserId) && m.role !== "owner" && (
              <form action={removeMemberAction}>
                <input type="hidden" name="boutique_id" value={boutiqueId} />
                <input type="hidden" name="user_id" value={m.user_id} />
                <input type="hidden" name="handle" value={handle} />
                <Button type="submit" variant="ghost" size="sm">
                  {m.user_id === currentUserId ? "Quitter" : "Retirer"}
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>

      {isOwner && (
        <form action={formAction} className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-medium">Ajouter un membre</p>
          {state.error && <Alert tone="error">{state.error}</Alert>}
          {state.success && <Alert tone="success">Membre ajouté.</Alert>}
          <input type="hidden" name="boutique_id" value={boutiqueId} />
          <input type="hidden" name="handle" value={handle} />
          <div>
            <Label htmlFor="member-username">Nom d&apos;utilisateur</Label>
            <Input id="member-username" name="username" placeholder="pseudo" autoCapitalize="none" />
          </div>
          <SubmitButton size="sm" pendingLabel="Ajout…">Ajouter</SubmitButton>
        </form>
      )}
    </div>
  );
}
