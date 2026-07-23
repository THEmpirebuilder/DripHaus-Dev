/** Formate un montant en devise (CHF par défaut), locale suisse romande. */
export function formatMoney(amount: number, currency = "CHF"): string {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency,
  }).format(amount);
}

/** Date lisible courte (ex. « 23 juil. 2026 »). */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** Date + heure (ex. « 23 juil. 2026, 14:05 »). */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
