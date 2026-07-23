"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/browser";
import { startCheckout } from "@/lib/actions/checkout";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

function InnerForm({ articleId }: { articleId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const res = await startCheckout(articleId);
    if (res.error || !res.clientSecret || !res.transactionId) {
      setError(res.error ?? "Impossible d'initier le paiement.");
      setLoading(false);
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      setError("Formulaire de carte indisponible.");
      setLoading(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(res.clientSecret, {
      payment_method: { card },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Paiement refusé.");
      setLoading(false);
      return;
    }

    if (
      paymentIntent &&
      ["succeeded", "processing", "requires_capture"].includes(paymentIntent.status)
    ) {
      router.push(`/orders/${res.transactionId}`);
      return;
    }

    setError("Le paiement n'a pas pu être finalisé.");
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="rounded-lg border border-border bg-surface-elevated p-3">
        <CardElement options={{ style: { base: { fontSize: "16px" } } }} />
      </div>
      <Button type="submit" className="w-full" disabled={!stripe || loading}>
        {loading ? "Paiement…" : "Payer maintenant"}
      </Button>
      <p className="text-center text-xs text-muted">
        Paiement sécurisé par Stripe. Les fonds sont retenus jusqu&apos;à la confirmation de livraison.
      </p>
    </form>
  );
}

export function CheckoutForm({ articleId }: { articleId: string }) {
  return (
    <Elements stripe={getStripe()}>
      <InnerForm articleId={articleId} />
    </Elements>
  );
}
