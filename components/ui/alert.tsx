import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "error" | "success" | "info";

const TONES: Record<Tone, string> = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-success/30 bg-success/10 text-success",
  info: "border-border bg-surface-elevated text-foreground",
};

export type AlertProps = {
  tone?: Tone;
  children: ReactNode;
  className?: string;
};

/** Encart de message (erreur / succès / info). Visuel pur. */
export function Alert({ tone = "info", children, className }: AlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-lg border px-3 py-2 text-sm", TONES[tone], className)}
    >
      {children}
    </div>
  );
}
