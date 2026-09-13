import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md";

/* États charte (page 08) : normal / survol / actif / inactif. Angle 2 px. */
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 active:opacity-100 active:brightness-95",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-surface-elevated active:bg-surface-elevated",
  ghost: "bg-transparent text-foreground hover:bg-surface-elevated active:bg-surface-elevated",
  destructive:
    "bg-destructive text-destructive-foreground hover:opacity-90 active:opacity-100 active:brightness-95",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[10.5px]",
  md: "h-11 px-6 text-[11px]",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

/** Bouton visuel pur. Label en micro-capitales (Syne 500, 0.14em). Aucune logique métier. */
export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium uppercase tracking-[0.14em]",
        "transition-[background-color,opacity,filter] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
