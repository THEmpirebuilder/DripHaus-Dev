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

/** Temps relatif court, style réseau social (« il y a 2 h », « il y a 3 j »). Au-delà de 7 jours, bascule sur la date. */
export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const s = Math.max(0, (Date.now() - then) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j < 7) return `il y a ${j} j`;
  return formatDate(iso);
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
