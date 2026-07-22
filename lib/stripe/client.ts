import "server-only";

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

/** Commission plateforme en points de base (250 = 2.5 %). */
export const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS ?? 250);

/** Convertit un montant CHF en centimes (unité Stripe). */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/** Commission prélevée par DripHaus sur une transaction, en centimes. */
export function platformFee(amountMinor: number): number {
  return Math.round((amountMinor * PLATFORM_FEE_BPS) / 10_000);
}
