import { cn } from "@/lib/utils/cn";
import { TYPE_LABEL, type SkillType } from "@/lib/studio/skills";

/**
 * Pastille de type de la taxonomie : Agent / Skill / Asset.
 * Couleurs calées sur la charte — l'or reste décoratif (Agent), l'accent bronze
 * pour l'action (Skill), l'écru neutre pour la donnée possédée (Asset).
 * Présentation pure.
 */
const TONES: Record<SkillType, string> = {
  agent: "bg-gold text-ink border-transparent",
  skill: "bg-transparent text-accent border-accent",
  asset: "bg-ecru text-silver-deep border-border",
};

export function SkillTag({ type, className }: { type: SkillType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.1em] leading-none",
        TONES[type],
        className
      )}
    >
      {TYPE_LABEL[type]}
    </span>
  );
}
