import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "verified";

/* Tons calés sur la palette charte — aucune couleur hors-palette (pas d'ambre).
   L'argent est réservé à l'authentification (ton « verified »). */
const TONES: Record<Tone, string> = {
  neutral: "bg-surface-elevated text-muted border-border",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-accent/10 text-accent border-accent/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  info: "bg-surface-elevated text-foreground border-border",
  verified: "bg-silver/15 text-silver-deep border-silver/40",
};

export type BadgeProps = {
  tone?: Tone;
  children: ReactNode;
  className?: string;
};

/** Étiquette compacte visuelle pure (statut, condition…). Pilule, micro-capitales. */
export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
