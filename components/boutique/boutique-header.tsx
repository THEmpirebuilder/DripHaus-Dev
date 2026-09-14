import type { Tables } from "@/types/database";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  active: { label: "Active", tone: "success" },
  pending: { label: "En attente", tone: "warning" },
  suspended: { label: "Suspendue", tone: "danger" },
};

/** En-tête d'une page boutique. Présentation pure (données en props). */
export function BoutiqueHeader({
  boutique,
  showStatus = false,
}: {
  boutique: Omit<Tables<"boutiques">, "stripe_account_id" | "siret_ide">;
  showStatus?: boolean;
}) {
  const status = STATUS[boutique.status];

  return (
    <div className="flex items-start gap-5">
      <Avatar src={boutique.logo_url} name={boutique.name} size={80} className="rounded-none border-accent/40" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="t-h2 truncate">{boutique.name}</h1>
          {boutique.kyc_verified && (
            <Badge tone="verified">
              <span className="mr-1 inline-block h-2 w-2 rotate-45 border border-silver" aria-hidden />
              Vérifiée
            </Badge>
          )}
          {showStatus && status && <Badge tone={status.tone}>{status.label}</Badge>}
        </div>
        <p className="mt-1.5 text-sm text-muted">@{boutique.handle}</p>
        {boutique.description && (
          <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {boutique.description}
          </p>
        )}
        {boutique.website_url && (
          <a
            href={boutique.website_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-2 inline-block text-sm text-accent underline underline-offset-4"
          >
            {boutique.website_url}
          </a>
        )}
      </div>
    </div>
  );
}
