"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { HouseDiamond } from "@/components/brand/house-diamond";
import { SkillTag } from "@/components/studio/skill-tag";

/**
 * Ingestion (famille A) — le point d'entrée du Studio. Trois sources :
 *   1. Importer depuis l'appareil (galerie / desktop)
 *   2. Prendre une photo (appareil photo, via capture sur mobile)
 *   3. Réutiliser une image déjà sur DripHaus (ses pièces / sa boutique)
 * La sélection et les aperçus fonctionnent côté client ; le lancement du
 * pipeline (détourage, attributs…) attend l'Engine — d'où le « Bientôt ».
 */
type Picked = { id: string; url: string; kind: "device" | "camera" | "catalogue"; revoke: boolean };

const KIND_LABEL: Record<Picked["kind"], string> = {
  device: "Import",
  camera: "Photo",
  catalogue: "DripHaus",
};

function IconUpload() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
function IconCamera() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
function IconCollection() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="13" height="13" rx="1" /><path d="M8 21h11a2 2 0 0 0 2-2V8" />
    </svg>
  );
}

export function StudioImport({ sources }: { sources: string[] }) {
  const [picked, setPicked] = useState<Picked[]>([]);
  const [showReuse, setShowReuse] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Libère les object-URLs créés depuis des fichiers locaux au démontage.
  useEffect(() => {
    return () => {
      picked.forEach((p) => p.revoke && URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(list: FileList | null, kind: "device" | "camera") {
    if (!list) return;
    const next: Picked[] = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ id: crypto.randomUUID(), url: URL.createObjectURL(f), kind, revoke: true }));
    setPicked((p) => [...p, ...next]);
  }

  function addFromCatalogue(url: string) {
    setPicked((p) => (p.some((x) => x.url === url) ? p : [...p, { id: crypto.randomUUID(), url, kind: "catalogue", revoke: false }]));
  }

  function remove(id: string) {
    setPicked((p) => {
      const target = p.find((x) => x.id === id);
      if (target?.revoke) URL.revokeObjectURL(target.url);
      return p.filter((x) => x.id !== id);
    });
  }

  const OPTIONS: { key: string; icon: React.ReactNode; title: string; sub: string; onClick: () => void }[] = [
    { key: "device", icon: <IconUpload />, title: "Importer", sub: "Galerie ou ordinateur", onClick: () => importRef.current?.click() },
    { key: "camera", icon: <IconCamera />, title: "Prendre une photo", sub: "Avec l'appareil photo", onClick: () => cameraRef.current?.click() },
    { key: "catalogue", icon: <IconCollection />, title: "Depuis mes pièces", sub: "Tes photos déjà sur DripHaus", onClick: () => setShowReuse((v) => !v) },
  ];

  return (
    <div className="mx-auto max-w-[820px] px-6 py-6 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="u-label flex items-center gap-2 text-[10px] text-muted">
            <HouseDiamond tier="or" size={8} />
            Étape 1 · Famille A · <span className="text-accent">Ingestion</span>
          </p>
          <h1 className="t-h2 mt-1.5">Importe tes photos</h1>
          <p className="mt-1.5 max-w-[60ch] text-[12.5px] text-muted">
            Plus tu donnes d&apos;angles — face, dos, détails de couture, étiquette de composition —
            meilleures seront la compréhension produit et la fidélité de l&apos;essayage.
          </p>
        </div>
        <SkillTag type="skill" />
      </div>

      {/* champs cachés : import multiple + appareil photo */}
      <input
        ref={importRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          addFiles(e.target.files, "device");
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          addFiles(e.target.files, "camera");
          e.target.value = "";
        }}
      />

      {/* 3 sources */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const isReuse = o.key === "catalogue";
          const active = isReuse && showReuse;
          return (
            <button
              key={o.key}
              type="button"
              onClick={o.onClick}
              aria-pressed={isReuse ? showReuse : undefined}
              className={cn(
                "group flex flex-col items-start gap-2.5 border bg-surface p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active ? "border-gold bg-surface-elevated" : "border-border hover:border-accent hover:bg-surface-elevated"
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center border border-border text-accent">{o.icon}</span>
              <span className="text-[14px] font-semibold leading-tight">{o.title}</span>
              <span className="text-[11.5px] leading-snug text-muted">{o.sub}</span>
            </button>
          );
        })}
      </div>

      {/* réutilisation catalogue */}
      {showReuse && (
        <div className="mt-4 border border-border bg-surface">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <IconCollection />
            <h3 className="flex-1 font-serif text-[15px]">Tes pièces sur DripHaus</h3>
            <span className="u-label text-[9px] text-muted">{sources.length} image{sources.length > 1 ? "s" : ""}</span>
          </div>
          {sources.length > 0 ? (
            <div className="grid grid-cols-3 gap-px bg-border sm:grid-cols-5">
              {sources.map((url) => {
                const chosen = picked.some((p) => p.url === url);
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => addFromCatalogue(url)}
                    className="group relative aspect-square overflow-hidden bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    aria-pressed={chosen}
                  >
                    <Image src={url} alt="" fill sizes="120px" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                    {chosen && (
                      <span className="absolute inset-0 flex items-center justify-center bg-ink/45 text-paper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-[12px] text-muted">
              Aucune pièce importable pour l&apos;instant. Publie une annonce, ou importe depuis ton appareil.
            </p>
          )}
        </div>
      )}

      {/* zone de préparation (sélection) */}
      <div className="mt-6">
        <p className="u-label mb-2.5 text-[9px] text-muted">
          À préparer {picked.length > 0 && <span className="text-accent">· {picked.length}</span>}
        </p>
        {picked.length > 0 ? (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
            {picked.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden border border-border bg-surface-elevated">
                {/* aperçu local (blob) ou distant — non optimisé pour accepter blob: */}
                <Image src={p.url} alt="" fill sizes="120px" unoptimized className="object-cover" />
                <span className="absolute left-1 top-1"><Badge tone="neutral" className="!px-1.5 !py-0 !text-[8px]">{KIND_LABEL[p.kind]}</Badge></span>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label="Retirer"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-ink/75 text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 border border-dashed border-border text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              <span className="text-[10px]">Ajouter</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 border border-dashed border-border bg-surface px-6 py-10 text-center transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="text-accent"><IconUpload /></span>
            <span className="text-[13px] font-semibold">Dépose ou choisis tes photos</span>
            <span className="text-[11.5px] text-muted">JPG ou PNG · plusieurs angles conseillés</span>
          </button>
        )}
      </div>

      {/* pied : lancement du pipeline (Engine à venir) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-[12px] text-muted">
          <HouseDiamond tier="or" size={7} />
          {picked.length > 0
            ? `${picked.length} photo${picked.length > 1 ? "s" : ""} prête${picked.length > 1 ? "s" : ""} — détourage & attributs à l'étape suivante.`
            : "Ajoute au moins une photo pour lancer la préparation."}
        </p>
        <span className="inline-flex items-center gap-2">
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-primary-foreground opacity-40"
          >
            Lancer la préparation
          </button>
          <Badge tone="warning">Bientôt</Badge>
        </span>
      </div>
    </div>
  );
}
