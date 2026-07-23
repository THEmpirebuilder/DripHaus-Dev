import Link from "next/link";
import type { ReviewWithAuthor } from "@/lib/queries/reviews";
import { formatDate } from "@/lib/utils/format";
import { Avatar } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/rating";
import { EmptyState } from "@/components/ui/empty-state";

/** Liste d'avis reçus. Présentation pure. */
export function ReviewList({ reviews }: { reviews: ReviewWithAuthor[] }) {
  if (reviews.length === 0) {
    return <EmptyState title="Aucun avis pour le moment." />;
  }

  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar src={r.reviewer?.avatarUrl} name={r.reviewer?.name} size={28} />
              {r.reviewer ? (
                <Link href={r.reviewer.href} className="text-sm font-medium hover:underline">
                  {r.reviewer.name}
                </Link>
              ) : (
                <span className="text-sm font-medium">Utilisateur</span>
              )}
            </div>
            <Rating value={r.rating} />
          </div>
          {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
          <p className="mt-1 text-xs text-muted">{formatDate(r.created_at)}</p>
        </li>
      ))}
    </ul>
  );
}
