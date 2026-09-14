"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Monogram } from "@/components/brand/monogram";
import { HouseDiamond } from "@/components/brand/house-diamond";
import { SkillTag } from "@/components/studio/skill-tag";
import { TextStudio } from "@/components/studio/text-studio";
import { FAMILY_BY_ID, type FamilyId, type Provider } from "@/lib/studio/skills";

type Tab = "assist" | "params" | "contract" | "text";

const PROVIDER_LABEL: Record<Provider, string> = {
  api: "API",
  "self-host": "Self-host",
  hybrid: "Hybride",
  infra: "Infra",
};

const TABS: { id: Tab; label: string }[] = [
  { id: "assist", label: "Assistant" },
  { id: "params", label: "Réglages" },
  { id: "contract", label: "Contrat" },
  { id: "text", label: "Texte" },
];

export function StudioDock({ activeId }: { activeId: FamilyId }) {
  const [tab, setTab] = useState<Tab>("assist");
  const fam = FAMILY_BY_ID[activeId];

  return (
    <div className="flex min-h-0 flex-col">
      <div role="tablist" className="flex flex-none border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex-1 px-2 py-3 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:-ring-offset-2",
              tab === t.id ? "text-foreground" : "text-muted hover:text-foreground"
            )}
          >
            {t.label}
            {tab === t.id && <span aria-hidden className="absolute inset-x-4 -bottom-px h-0.5 bg-gold" />}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* ASSISTANT (agent K) */}
        {tab === "assist" && (
          <div className="flex flex-col gap-3.5 p-4">
            <div className="flex gap-2.5">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ecru text-[10px] font-bold text-accent">Toi</span>
              <p className="flex-1 border border-border p-2.5 text-[13px] leading-relaxed">
                Mets cette veste sur un mannequin masculin, ambiance rue Zurich automne, et propose de quoi compléter le bas.
              </p>
            </div>
            <div className="flex gap-2.5">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink"><Monogram size={16} /></span>
              <div className="flex-1 bg-surface-elevated p-2.5 text-[13px] leading-relaxed">
                J&apos;enchaîne les skills nécessaires :
                <ul className="mt-2 flex flex-col gap-1.5">
                  {[
                    ["Détourage + attributs", "fait"],
                    ["Essayage sur mannequin Léo", "fait"],
                    ["Scène éditoriale urbaine", "en cours…"],
                    ["Matching bas + chaussures", ""],
                  ].map(([label, state]) => (
                    <li key={label} className="flex items-center gap-2 text-[11.5px] text-muted">
                      <HouseDiamond tier="or" size={6} />
                      <span className="font-semibold text-foreground">{label}</span>
                      {state && <span className={state === "fait" ? "text-success" : "text-accent"}>— {state}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-2 border-t border-border pt-3">
              <input
                id="studio-ask"
                disabled
                placeholder="Assistant conversationnel — bientôt"
                className="min-w-0 flex-1 border border-border bg-surface-elevated px-3 py-2.5 text-[13px] text-muted"
              />
              <Badge tone="warning">Bientôt</Badge>
            </div>
          </div>
        )}

        {/* RÉGLAGES — surfacent le registre (moteur, provider, crédits, statut) */}
        {tab === "params" && (
          <div className="p-4">
            <p className="u-label mb-1 text-[9px] text-muted">Couche {fam.id} · {fam.label}</p>
            <h3 className="font-serif mb-3 text-[17px]">Skills de la couche</h3>
            <ul className="flex flex-col divide-y divide-border border border-border">
              {fam.skills.map((s) => (
                <li key={s.key} className="flex items-start gap-3 p-3">
                  <SkillTag type={s.type} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-snug">{s.label}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted">{s.hint}</p>
                    <p className="mt-1 text-[10px] text-muted">
                      {PROVIDER_LABEL[s.provider]}
                      {s.engine ? ` · ${s.engine}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1">
                    {s.credits > 0 ? (
                      <span className="font-serif text-[15px] tabular-nums">
                        {s.credits}
                        <span className="ml-0.5 font-sans text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">cr.</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted">inclus</span>
                    )}
                    {s.status === "live" ? (
                      <Badge tone="success">Actif</Badge>
                    ) : (
                      <Badge tone="warning">Bientôt</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex gap-2 text-[11px] leading-relaxed text-muted">
              <HouseDiamond tier="or" size={7} className="mt-1 flex-none" />
              Le brouillon basse-déf est offert. Seul le rendu HD validé débite des crédits — itère librement avant de figer.
            </p>
            {fam.id === "G" && (
              <p className="mt-3 text-[12px] text-accent">→ Génère dès maintenant dans l&apos;onglet <b>Texte</b>.</p>
            )}
          </div>
        )}

        {/* CONTRAT d'assets JSON */}
        {tab === "contract" && (
          <div>
            <div className="px-4 pb-1 pt-4">
              <h3 className="font-serif text-[16px]">Contrat d&apos;assets</h3>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                Chaque sortie porte ses métadonnées : rejouable, auditable, indépendant du moteur. C&apos;est le cœur propriétaire du Studio.
              </p>
            </div>
            <pre className="mx-4 my-3 overflow-x-auto border border-border p-3 text-[11.5px] leading-[1.65]" style={{ background: "#0d0c0a", color: "#e8e3d9", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
{`{
  `}<span style={{ color: "#e8ce94" }}>&quot;schema&quot;</span>{`: `}<span style={{ color: "#a9c7b0" }}>&quot;driphaus.studio.asset/1&quot;</span>{`,
  `}<span style={{ color: "#e8ce94" }}>&quot;layer&quot;</span>{`: `}<span style={{ color: "#a9c7b0" }}>&quot;tryon&quot;</span>{`,
  `}<span style={{ color: "#e8ce94" }}>&quot;generation&quot;</span>{`: {
    `}<span style={{ color: "#e8ce94" }}>&quot;engine&quot;</span>{`: `}<span style={{ color: "#a9c7b0" }}>&quot;fashn&quot;</span>{`, `}<span style={{ color: "#e8ce94" }}>&quot;seed&quot;</span>{`: `}<span style={{ color: "#d8b6d0" }}>738291</span>{`
  },
  `}<span style={{ color: "#e8ce94" }}>&quot;garment&quot;</span>{`: {
    `}<span style={{ color: "#e8ce94" }}>&quot;preserve_zones&quot;</span>{`: [`}<span style={{ color: "#a9c7b0" }}>&quot;logo&quot;</span>{`, `}<span style={{ color: "#a9c7b0" }}>&quot;delave&quot;</span>{`]
  },
  `}<span style={{ color: "#e8ce94" }}>&quot;mannequin&quot;</span>{`: { `}<span style={{ color: "#e8ce94" }}>&quot;id&quot;</span>{`: `}<span style={{ color: "#a9c7b0" }}>&quot;nadia&quot;</span>{`, `}<span style={{ color: "#e8ce94" }}>&quot;version&quot;</span>{`: `}<span style={{ color: "#d8b6d0" }}>3</span>{` },
  `}<span style={{ color: "#e8ce94" }}>&quot;qa&quot;</span>{`: { `}<span style={{ color: "#e8ce94" }}>&quot;verdict&quot;</span>{`: `}<span style={{ color: "#a9c7b0" }}>&quot;pass&quot;</span>{` },
  `}<span style={{ color: "#e8ce94" }}>&quot;provenance&quot;</span>{`: {
    `}<span style={{ color: "#e8ce94" }}>&quot;ai_generated&quot;</span>{`: `}<span style={{ color: "#d8b6d0" }}>true</span>{`, `}<span style={{ color: "#e8ce94" }}>&quot;c2pa&quot;</span>{`: `}<span style={{ color: "#d8b6d0" }}>true</span>{`
  }
}`}
            </pre>
            <div className="flex flex-wrap gap-3.5 border-t border-border bg-surface-elevated px-4 py-3 text-[11px] text-muted">
              <span className="flex items-center gap-1.5"><SkillTag type="agent" /> orchestre</span>
              <span className="flex items-center gap-1.5"><SkillTag type="skill" /> une action</span>
              <span className="flex items-center gap-1.5"><SkillTag type="asset" /> donnée possédée</span>
            </div>
          </div>
        )}

        {/* TEXTE — famille G, réellement active */}
        {tab === "text" && (
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="font-serif text-[16px]">Studio Texte</h3>
              <Badge tone="success">Actif</Badge>
            </div>
            <TextStudio />
          </div>
        )}
      </div>
    </div>
  );
}
