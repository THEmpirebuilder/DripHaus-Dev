"use client";

import { cn } from "@/lib/utils/cn";
import { pipelineSteps, type FamilyId } from "@/lib/studio/skills";
import { SkillTag } from "@/components/studio/skill-tag";

/**
 * Rail « du packshot au lookbook » : le pipeline A→L (hors K agent et J
 * gouvernance, qui vivent dans la chrome). Présentation pure — l'état actif et
 * le clic remontent au workstation. Les familles proviennent du registre de
 * skills (source de vérité).
 */
export function StudioRail({
  activeId,
  onSelect,
  guided,
  onAutopilot,
}: {
  activeId: FamilyId;
  onSelect: (id: FamilyId) => void;
  guided: boolean;
  onAutopilot: () => void;
}) {
  const steps = pipelineSteps();
  // Progression illustrative : les 3 premières couches « faites », l'active en cours.
  const doneUntil = 2;

  return (
    <nav aria-label="Pipeline du Studio" className="flex flex-col gap-0 py-4">
      {guided && (
        <div className="relative mx-3 mb-4 overflow-hidden bg-ink p-4 text-paper">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full"
            style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--gold) 40%, transparent), transparent 70%)" }}
          />
          <p className="u-label text-[9px]" style={{ color: "var(--gold-reflect)" }}>
            Auto-pilote · Agent
          </p>
          <h3 className="font-serif mt-1.5 text-[19px] leading-tight text-paper">Du packshot au lookbook</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-paper/70">
            Décris ton intention, l&apos;agent enchaîne détourage, mannequin, essayage, scène et texte.
          </p>
          <button
            type="button"
            onClick={onAutopilot}
            className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-reflect focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            style={{ background: "linear-gradient(135deg, var(--gold-reflect), var(--gold) 60%, var(--gold-shadow))" }}
          >
            ✦ Lancer l&apos;auto-pilote
          </button>
        </div>
      )}

      <div className="flex items-center justify-between px-4 pb-2">
        <h2 className="font-serif text-[17px]">Atelier</h2>
        <span className="u-label text-[9px] text-muted">A → L</span>
      </div>
      <p className="px-4 pb-3 text-[11px] leading-relaxed text-muted">
        Pilote chaque couche, ou laisse l&apos;agent orchestrer. Chaque sortie est figée avant la suivante.
      </p>

      <ul className="border-t border-border">
        {steps.map((fam, i) => {
          const active = fam.id === activeId;
          const done = i <= doneUntil && !active;
          return (
            <li key={fam.id}>
              <button
                type="button"
                onClick={() => onSelect(fam.id)}
                aria-current={active}
                className={cn(
                  "flex w-full items-start gap-3 border-l-[3px] px-4 py-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:-ring-offset-2",
                  active
                    ? "border-l-gold bg-surface-elevated"
                    : "border-l-transparent hover:bg-surface-elevated"
                )}
              >
                <span
                  className={cn(
                    "mt-px flex h-5 w-5 flex-none items-center justify-center rounded-full font-serif text-[12px] tabular-nums",
                    active
                      ? "bg-ink text-paper"
                      : done
                        ? "bg-success text-white"
                        : "border border-border text-muted"
                  )}
                >
                  {fam.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
                    {fam.label}
                    <SkillTag type={fam.type} className="ml-auto" />
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-muted">{fam.tagline}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
