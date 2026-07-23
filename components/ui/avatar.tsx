import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export type AvatarProps = {
  src?: string | null;
  /** Sert d'alt et de source pour l'initiale de repli. */
  name?: string | null;
  size?: number;
  className?: string;
};

/** Avatar visuel pur : image si disponible, sinon initiale. */
export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-elevated text-sm font-medium text-muted",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={name ?? "Avatar"} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </span>
  );
}
