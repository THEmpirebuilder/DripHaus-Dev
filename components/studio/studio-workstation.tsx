"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Monogram } from "@/components/brand/monogram";
import { StudioRail } from "@/components/studio/studio-rail";
import { StudioCanvas } from "@/components/studio/studio-canvas";
import { StudioDock } from "@/components/studio/studio-dock";
import type { FamilyId } from "@/lib/studio/skills";
import type { MatchPiece } from "@/lib/queries/studio";
import type { Enums } from "@/types/database";

type Role = Enums<"user_role">;
type PersonaView = "particulier" | "pro";

const PERSONAS: { role: Role; label: string }[] = [
  { role: "particulier", label: "Particulier" },
  { role: "createur", label: "Créateur" },
  { role: "boutique", label: "Boutique" },
];

/**
 * Poste de travail du Studio (couche présentation, orchestration d'état UI).
 * Archi hybride, défaut par persona : particulier → auto-pilote guidé ;
 * créateur/boutique → atelier complet. Aucune logique métier ici — les données
 * (matching réel, persona) arrivent en props depuis la page serveur.
 */
export function StudioWorkstation({
  persona,
  matches,
}: {
  persona: Role;
  matches: MatchPiece[];
}) {
  const [view, setView] = useState<PersonaView>(persona === "particulier" ? "particulier" : "pro");
  const [activeId, setActiveId] = useState<FamilyId>("D");
  const guided = view === "particulier";

  return (
    <section className="flex flex-col" style={{ minHeight: "calc(100dvh - 6rem)" }}>
      {/* barre d'outils du Studio */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border bg-surface px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Monogram size={28} />
          <span className="font-serif text-[15px] leading-none tracking-[0.14em]">STUDIO</span>
        </div>

        <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />

        <div role="group" aria-label="Profil actif" className="flex gap-0.5 rounded-full border border-border bg-ecru p-0.5">
          {PERSONAS.map((p) => {
            const isActive = activeRoleMatches(view, p.role, persona);
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => setView(p.role === "particulier" ? "particulier" : "pro")}
                aria-pressed={isActive}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <span className="hidden items-center gap-2 text-[12px] font-semibold text-muted sm:flex" title="File d'exécution des générations (famille J)">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
          File d&apos;exécution
        </span>

        <div
          className="flex items-center gap-3 border border-border bg-surface-elevated px-3.5 py-2"
          title="Crédits pondérés par coût — brouillon offert, rendu final facturé (WB4)"
        >
          <div>
            <div className="font-serif text-[19px] leading-none tabular-nums">
              248 <sup className="align-super text-[8px] font-sans font-semibold uppercase tracking-[0.1em] text-muted">démo</sup>
            </div>
            <div className="u-label text-[8px] text-muted">crédits</div>
          </div>
          <div aria-hidden className="relative h-1 w-20 overflow-hidden bg-border">
            <span className="absolute inset-y-0 left-0 right-[42%]" style={{ background: "linear-gradient(90deg, var(--gold), var(--gold-shadow))" }} />
          </div>
        </div>
      </div>

      {/* zone de travail : rail | canvas | dock */}
      <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[288px_1fr_340px] lg:overflow-hidden">
        <div className="border-b border-border bg-surface lg:h-full lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <StudioRail activeId={activeId} onSelect={setActiveId} guided={guided} onAutopilot={() => setActiveId("A")} />
        </div>

        <div className="bg-ecru lg:h-full lg:overflow-y-auto">
          <StudioCanvas activeId={activeId} matches={matches} />
        </div>

        <div className="border-t border-border bg-surface lg:h-full lg:overflow-hidden lg:border-l lg:border-t-0">
          <StudioDock activeId={activeId} />
        </div>
      </div>
    </section>
  );
}

/** Le bouton persona pressé reflète la vue ; « Créateur » et « Boutique » partagent la vue pro,
 *  celui pressé étant le rôle réel de l'utilisateur (sinon Créateur par défaut en vue pro). */
function activeRoleMatches(view: PersonaView, buttonRole: Role, realRole: Role): boolean {
  if (view === "particulier") return buttonRole === "particulier";
  // vue pro : on met en avant le rôle réel s'il est pro, sinon Créateur.
  const proReal: Role = realRole === "boutique" ? "boutique" : "createur";
  return buttonRole === proReal;
}
