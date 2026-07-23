"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

export type SubmitButtonProps = Omit<ButtonProps, "type"> & {
  pendingLabel?: string;
};

/**
 * Bouton de soumission qui reflète l'état `pending` du formulaire parent.
 * Reste purement présentationnel : ne connaît aucune action métier.
 */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending ? pendingLabel ?? "…" : children}
    </Button>
  );
}
