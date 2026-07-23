import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-elevated text-muted border-border",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  info: "bg-primary/10 text-foreground border-border",
};

export type BadgeProps = {
  tone?: Tone;
  children: ReactNode;
  className?: string;
};

/** Étiquette compacte visuelle pure (statut, condition…). */
export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
