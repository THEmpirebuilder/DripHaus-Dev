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
          <Button variant="outline" size="sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="19" y1="12" x2="5" y2="12" /><polyline points="11 6 5 12 11 18" /></svg>
            Précédent
          </Button>
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted">Page {page + 1}</span>
      {nextHref ? (
        <Link href={nextHref}>
          <Button variant="outline" size="sm">
            Suivant
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="5" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></svg>
          </Button>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
