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
  boutique: Tables<"boutiques">;
  showStatus?: boolean;
}) {
  const status = STATUS[boutique.status];

  return (
    <div className="flex items-start gap-4">
      <Avatar src={boutique.logo_url} name={boutique.name} size={72} className="rounded-xl" />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-2xl font-semibold">{boutique.name}</h1>
          {boutique.kyc_verified && <Badge tone="success">Vérifiée</Badge>}
          {showStatus && status && <Badge tone={status.tone}>{status.label}</Badge>}
        </div>
        <p className="text-sm text-muted">@{boutique.handle}</p>
        {boutique.description && <p className="mt-3 whitespace-pre-line text-sm">{boutique.description}</p>}
        {boutique.website_url && (
          <a
            href={boutique.website_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-2 inline-block text-sm underline underline-offset-4"
          >
            {boutique.website_url}
          </a>
        )}
      </div>
    </div>
  );
}
