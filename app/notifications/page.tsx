import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getNotifications, type Notification } from "@/lib/queries/notifications";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/actions/notifications";
import { formatDateTime } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Notifications" };

/** Lien vers la ressource référencée par une notification. */
function refHref(n: Notification): string | null {
  if (!n.reference_type || !n.reference_id) return null;
  switch (n.reference_type) {
    case "article":
      return `/article/${n.reference_id}`;
    case "auction":
      return `/auction/${n.reference_id}`;
    case "post":
      return `/feed/${n.reference_id}`;
    case "transaction":
      return `/orders/${n.reference_id}`;
    default:
      return null;
  }
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getNotifications(user.authId);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {notifications.some((n) => !n.is_read) && (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">Tout marquer comme lu</Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="Aucune notification." description="Tu seras prévenu ici des ventes, offres et abonnements." />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const href = refHref(n);
            const body = (
              <div className="flex items-start justify-between gap-3">
                <div>
                  {n.title && <p className="text-sm font-medium">{n.title}</p>}
                  {n.body && <p className="text-sm text-muted">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted">{formatDateTime(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Non lu" />}
              </div>
            );

            return (
              <li
                key={n.id}
                className={cn(
                  "rounded-xl border border-border p-4",
                  !n.is_read && "bg-surface-elevated"
                )}
              >
                {href ? <Link href={href}>{body}</Link> : body}
                {!n.is_read && (
                  <form action={markNotificationReadAction} className="mt-2">
                    <input type="hidden" name="notification_id" value={n.id} />
                    <button type="submit" className="text-xs text-muted underline underline-offset-4">
                      Marquer comme lu
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
