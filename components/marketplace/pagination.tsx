import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Pagination Précédent / Suivant. Présentation pure (liens fournis en props). */
export function Pagination({
  prevHref,
  nextHref,
  page,
}: {
  prevHref: string | null;
  nextHref: string | null;
  page: number;
}) {
  if (!prevHref && !nextHref) return null;

  return (
    <div className="mt-8 flex items-center justify-between">
      {prevHref ? (
        <Link href={prevHref}>
          <Button variant="outline" size="sm">← Précédent</Button>
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted">Page {page + 1}</span>
      {nextHref ? (
        <Link href={nextHref}>
          <Button variant="outline" size="sm">Suivant →</Button>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
