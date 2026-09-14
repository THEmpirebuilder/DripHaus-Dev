import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/** Bloc « rien à afficher » réutilisable — losange or, titre Italiana. Visuel pur. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center border border-dashed border-border px-8 py-14 text-center", className)}>
      <span aria-hidden className="mb-5 inline-block h-3 w-3 rotate-45 border border-accent/60" />
      {title && <p className="font-serif text-xl leading-tight">{title}</p>}
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
