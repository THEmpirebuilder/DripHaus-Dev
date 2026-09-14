import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Price } from "@/components/ui/price";
import { HouseDiamond } from "@/components/brand/house-diamond";
import { SkillTag } from "@/components/studio/skill-tag";
import { StudioImport } from "@/components/studio/studio-import";
import { FAMILY_BY_ID, TYPE_LABEL, PIPELINE_ORDER, type FamilyId } from "@/lib/studio/skills";
import { TIER_LABEL } from "@/lib/utils/house-tier";
import type { MatchPiece } from "@/lib/queries/studio";

/* Pièce d'exemple qui traverse le pipeline (contenu réel du catalogue démo). */
const SUBJECT = "Veste en jean Levi's";

/* Ce que chaque couche PRODUIT (affiché sous le titre du stage). */
const PRODUCES: Record<FamilyId, string> = {
  A: "Input propre : détouré, redressé, étiquette lue.",
  B: "Fiche d'attributs structurée + zones à préserver.",
  C: "Mannequin maître verrouillé, prêt à réutiliser.",
  D: "Image canonique figée — mannequin habillé.",
  E: "Mise en scène éditoriale ou packshot propre.",
  F: "Micro-clip animé depuis l'image validée.",
  G: "Description, légende et balises SEO (déjà actif).",
  H: "Thème de vitrine, cover et presets de marque.",
  I: "Déclinaisons multi-format prêtes à diffuser.",
  J: "Traçabilité, QA et comptabilité des crédits.",
  K: "Orchestration en langage naturel.",
  L: "Pièces à acheter pour compléter le look.",
};

/* Étapes de la lignée (asset lineage). Mappe chaque famille à sa position. */
const LINEAGE: { id: FamilyId; label: string }[] = [
  { id: "A", label: "Input" },
  { id: "B", label: "Attributs" },
  { id: "C", label: "Mannequin" },
  { id: "D", label: "Essayage" },
  { id: "E", label: "Scène" },
  { id: "F", label: "Vidéo" },
];

function Silhouette({ stroke = "var(--silver-deep)" }: { stroke?: string }) {
  return (
    <svg viewBox="0 0 120 150" className="w-[54%]" aria-hidden>
      <g fill="none" stroke={stroke} strokeWidth="1.4">
        <circle cx="60" cy="26" r="15" />
        <path d="M42 54c0-8 8-13 18-13s18 5 18 13l4 34H38Z" />
        <path d="M42 54 30 66l8 12 8-8M78 54l12 12-8 12-8-8" />
        <path d="M45 88h30l4 54H41Z" />
        <path d="M60 88v54" />
      </g>
    </svg>
  );
}

export function StudioCanvas({
  activeId,
  matches,
  sources,
}: {
  activeId: FamilyId;
  matches: MatchPiece[];
  sources: string[];
}) {
  // Famille A = ingestion : le point d'entrée réel (import / photo / réutilisation).
  if (activeId === "A") return <StudioImport sources={sources} />;

  const fam = FAMILY_BY_ID[activeId];
  const stepNo = PIPELINE_ORDER.indexOf(activeId) + 1;
  const isMatching = activeId === "L";

  return (
    <div className="mx-auto max-w-[820px] px-6 py-6 sm:px-8">
      {/* stage header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="u-label flex items-center gap-2 text-[10px] text-muted">
            <HouseDiamond tier="or" size={8} />
            Étape {stepNo} · Famille {fam.id} · <span className="text-accent">{TYPE_LABEL[fam.type]}</span>
          </p>
          <h1 className="t-h2 mt-1.5">{isMatching ? `${SUBJECT} · complète le look` : `${fam.label} — ${SUBJECT}`}</h1>
          <p className="mt-1.5 text-[12.5px] text-muted">{PRODUCES[fam.id]}</p>
        </div>
        <div className="inline-flex border border-border bg-surface">
          <span className="bg-ink px-3 py-2 text-[11.5px] font-semibold text-paper">Brouillon · gratuit</span>
          <span className="px-3 py-2 text-[11.5px] font-semibold text-muted">Final · {fam.skills[0]?.credits ?? 0} cr.</span>
        </div>
      </div>

      {/* aperçu frame */}
      <div className="mt-5 border border-border bg-surface shadow-md">
        <div
          className="relative grid aspect-[4/5] max-h-[440px] place-items-center"
          style={{ background: "radial-gradient(120% 90% at 50% 8%, color-mix(in srgb, var(--gold) 8%, var(--surface-elevated)), var(--surface-elevated))" }}
        >
          <Silhouette />
          <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1.5 border border-silver bg-surface px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-silver-deep">
            <HouseDiamond tier="argent" size={7} /> Argent · {TIER_LABEL.argent}
          </span>
          <span className="absolute bottom-3.5 left-3.5 inline-flex items-center gap-1.5 bg-ink/80 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-white">
            Aperçu · le rendu généré s&apos;affiche ici
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <div>
            <p className="font-serif text-[17px]">{fam.label}</p>
            <p className="mt-0.5 text-[11px] text-muted">{fam.tagline}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-success">
            ✓ QA
          </span>
        </div>
      </div>

      {/* lineage */}
      <div className="mt-6">
        <p className="u-label mb-2.5 text-[9px] text-muted">Lignée de l&apos;asset · versioning</p>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          {LINEAGE.map((step, i) => {
            const pos = LINEAGE.findIndex((s) => s.id === activeId);
            const reached = pos < 0 ? i <= 3 : i <= pos;
            const current = step.id === activeId;
            return (
              <div key={step.id} className="flex flex-none items-center gap-2.5">
                <div className="w-[68px]">
                  <div
                    className={cn(
                      "grid h-[86px] w-[68px] place-items-center border bg-surface-elevated",
                      current ? "border-gold ring-2 ring-gold/35" : reached ? "border-border" : "border-dashed border-border opacity-50"
                    )}
                  >
                    <Silhouette stroke={current ? "var(--gold)" : "var(--silver-deep)"} />
                  </div>
                  <p className={cn("mt-1 text-center text-[10px]", current ? "font-semibold text-accent" : "text-muted")}>{step.label}</p>
                </div>
                {i < LINEAGE.length - 1 && <span className="text-muted" aria-hidden>›</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* matching (famille L) — vraies pièces en vente */}
      {matches.length > 0 && (
        <div className="mt-6 border border-border bg-surface">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
            <HouseDiamond tier="or" size={8} />
            <h3 className="flex-1 font-serif text-[16px]">Complète le look — en vente sur DripHaus</h3>
            <SkillTag type="skill" />
          </div>
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
            {matches.map((m) => (
              <div key={m.id} className="bg-surface p-3">
                <div className="relative mb-2.5 grid aspect-square place-items-center overflow-hidden bg-ecru">
                  {m.image ? (
                    <Image src={m.image} alt={m.title} fill sizes="200px" className="object-cover" />
                  ) : (
                    <Silhouette />
                  )}
                </div>
                <p className="line-clamp-2 text-[12px] font-semibold leading-snug">{m.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                  <HouseDiamond tier={m.tier} size={7} />
                  {m.brand ?? "Sans marque"}
                  {m.size ? ` · ${m.size}` : ""}
                </p>
                <Price className="mt-1.5 text-[15px]" amount={m.price} currency={m.currency} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
