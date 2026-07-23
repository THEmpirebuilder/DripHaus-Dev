import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Notifie le vendeur d'une transaction (user OU membres de la boutique).
 * Exécuté en service_role (RLS contournée) : c'est le point autorisé à
 * insérer des notifications côté serveur.
 */
async function notifyTransactionSeller(
  supabase: AdminClient,
  transactionId: string,
  type: Enums<"notification_type">,
  title: string,
  body: string
) {
  const { data: tx } = await supabase
    .from("transactions")
    .select("seller_user_id, seller_boutique_id")
    .eq("id", transactionId)
    .maybeSingle();
  if (!tx) return;

  if (tx.seller_user_id) {
    await supabase.from("notifications").insert({
      user_id: tx.seller_user_id,
      type,
      title,
      body,
      reference_type: "transaction",
      reference_id: transactionId,
    });
  } else if (tx.seller_boutique_id) {
    const { data: members } = await supabase
      .from("boutique_members")
      .select("user_id")
      .eq("boutique_id", tx.seller_boutique_id);
    if (members && members.length > 0) {
      await supabase.from("notifications").insert(
        members.map((m) => ({
          user_id: m.user_id,
          type,
          title,
          body,
          reference_type: "transaction" as const,
          reference_id: transactionId,
        }))
      );
    }
  }
}

// Le webhook a besoin du corps brut pour vérifier la signature Stripe.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint webhook Stripe.
 * URL à déclarer dans Stripe : https://<domaine>/api/webhooks/stripe
 *
 * Ce handler s'exécute côté serveur avec le client service_role
 * (createAdminClient) : c'est le SEUL point autorisé à faire évoluer
 * payment_status / payout_status, les RLS interdisant ces mises à jour
 * côté client.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json(
      { error: "Signature ou secret webhook manquant" },
      { status: 400 }
    );
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // Paiement acheteur réussi → fonds encaissés et retenus (escrow).
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const transactionId = pi.metadata?.transaction_id;
        if (transactionId) {
          const { data: tx } = await supabase
            .from("transactions")
            .update({
              payment_status: "held",
              stripe_payment_id: pi.id,
            })
            .eq("id", transactionId)
            .select("article_id")
            .maybeSingle();

          // L'article payé sort du marché.
          if (tx?.article_id) {
            await supabase.from("articles").update({ status: "sold" }).eq("id", tx.article_id);
          }

          // Notifie le vendeur de la vente encaissée.
          await notifyTransactionSeller(
            supabase,
            transactionId,
            "sale",
            "Vente confirmée",
            "Ton article a été vendu et le paiement est sécurisé."
          );
        }
        break;
      }

      // Échec de paiement.
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const transactionId = pi.metadata?.transaction_id;
        if (transactionId) {
          await supabase
            .from("transactions")
            .update({ payment_status: "failed" })
            .eq("id", transactionId);
        }
        break;
      }

      // Virement vendeur déclenché → payout libéré.
      case "transfer.created": {
        const transfer = event.data.object as Stripe.Transfer;
        const transactionId = transfer.metadata?.transaction_id;
        if (transactionId) {
          await supabase
            .from("transactions")
            .update({
              payout_status: "released",
              payout_amount: transfer.amount / 100,
              payout_released_at: new Date().toISOString(),
            })
            .eq("id", transactionId);

          await notifyTransactionSeller(
            supabase,
            transactionId,
            "payout",
            "Versement effectué",
            "Le montant de ta vente vient de t'être versé."
          );
        }
        break;
      }

      // Mise à jour du compte connecté → statut KYC vendeur.
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const kycDone =
          account.charges_enabled === true &&
          account.payouts_enabled === true &&
          account.details_submitted === true;

        // Le compte connecté peut appartenir à un user OU à une boutique.
        await supabase
          .from("users")
          .update({ kyc_verified: kycDone })
          .eq("stripe_account_id", account.id);

        await supabase
          .from("boutiques")
          .update({ kyc_verified: kycDone })
          .eq("stripe_account_id", account.id);
        break;
      }

      default:
        // Événement non traité : on l'accuse quand même en 200
        // pour éviter que Stripe ne le rejoue indéfiniment.
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    // 500 → Stripe rejouera l'événement.
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
