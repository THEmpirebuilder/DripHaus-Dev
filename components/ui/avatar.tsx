import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export type AvatarProps = {
  src?: string | null;
  /** Sert d'alt et de source pour les initiales de repli. */
  name?: string | null;
  size?: number;
  className?: string;
};

/** Jusqu'à 2 initiales à partir du nom (« Maison Hirondelle » → « MH »). */
function initials(name?: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Avatar visuel pur : image si disponible, sinon initiales en Italiana (repli de marque).
 *  Les placeholders de démo DiceBear (pâles, peu lisibles) sont ignorés au profit du repli. */
export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const showImage = !!src && !/dicebear\.com/i.test(src);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-elevated",
        className
      )}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image src={src!} alt={name ?? "Avatar"} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="font-serif leading-none text-accent"
          style={{ fontSize: Math.max(11, Math.round(size * 0.4)) }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}
