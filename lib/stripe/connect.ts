import "server-only";

import { stripe, platformFee, toMinorUnits } from "./client";

/**
 * Crée un compte Stripe Connect Express pour un vendeur.
 * L'ID retourné doit être stocké dans users.stripe_account_id
 * ou boutiques.stripe_account_id.
 */
export async function createConnectedAccount(params: {
  email: string;
  country?: string;
  businessType?: "individual" | "company";
}) {
  return stripe.accounts.create({
    type: "express",
    country: params.country ?? "CH",
    email: params.email,
    business_type: params.businessType ?? "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    settings: {
      // Payout différé : DripHaus déclenche le virement après confirmation de livraison.
      payouts: { schedule: { interval: "manual" } },
    },
  });
}

/** Lien d'onboarding KYC à présenter au vendeur. */
export async function createAccountOnboardingLink(params: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}) {
  return stripe.accountLinks.create({
    account: params.accountId,
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
    type: "account_onboarding",
  });
}

/**
 * Payment Intent en "separate charges and transfers" : les fonds sont
 * encaissés par la plateforme et restent retenus jusqu'à la livraison.
 */
export async function createEscrowPaymentIntent(params: {
  amountChf: number;
  transactionId: string;
  buyerUserId: string;
  sellerAccountId: string;
}) {
  const amount = toMinorUnits(params.amountChf);

  return stripe.paymentIntents.create({
    amount,
    currency: "chf",
    capture_method: "automatic",
    metadata: {
      transaction_id: params.transactionId,
      buyer_user_id: params.buyerUserId,
      seller_account_id: params.sellerAccountId,
      platform_fee: String(platformFee(amount)),
    },
  });
}

/** Libère le payout vendeur — à appeler après confirmation de livraison. */
export async function releaseSellerPayout(params: {
  amountChf: number;
  sellerAccountId: string;
  transactionId: string;
}) {
  const amount = toMinorUnits(params.amountChf);
  const fee = platformFee(amount);

  return stripe.transfers.create({
    amount: amount - fee,
    currency: "chf",
    destination: params.sellerAccountId,
    metadata: { transaction_id: params.transactionId },
  });
}
