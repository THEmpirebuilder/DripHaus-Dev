"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { Constants, type Enums } from "@/types/database";

export type DisputeFormState = { error?: string; success?: boolean };

const REASONS = Constants.public.Enums.dispute_reason;

/**
 * Ouvre un litige sur une transaction (RLS : partie prenante uniquement,
 * statut forcé à `open`). La résolution est réservée à l'administration.
 */
export async function openDisputeAction(
  _prev: DisputeFormState,
  formData: FormData
): Promise<DisputeFormState> {
  const user = await requireUser();
  const supabase = await createClient();

  const transactionId = String(formData.get("transaction_id") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!transactionId) return { error: "Transaction introuvable." };
  if (!(REASONS as readonly string[]).includes(reason)) {
    return { error: "Motif invalide." };
  }

  const { error } = await supabase.from("disputes").insert({
    transaction_id: transactionId,
    raised_by_user_id: user.authId,
    reason: reason as Enums<"dispute_reason">,
    description,
    status: "open",
  });

  if (error) return { error: error.message };

  revalidatePath(`/orders/${transactionId}`);
  return { success: true };
}
