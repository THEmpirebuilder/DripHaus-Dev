import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";

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
          await supabase
            .from("transactions")
            .update({
              payment_status: "held",
              stripe_payment_id: pi.id,
            })
            .eq("id", transactionId);
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
