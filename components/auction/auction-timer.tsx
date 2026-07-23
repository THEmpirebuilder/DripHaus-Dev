"use client";

import { useEffect, useState } from "react";

function remaining(endsAt: string): { text: string; ended: boolean } {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return { text: "Terminée", ended: true };

  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const text = d > 0 ? `${d}j ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`;
  return { text, ended: false };
}

/** Compte à rebours d'une enchère. Îlot client (se met à jour chaque seconde). */
export function AuctionTimer({ endsAt, className }: { endsAt: string; className?: string }) {
  const [state, setState] = useState<{ text: string; ended: boolean } | null>(null);

  useEffect(() => {
    setState(remaining(endsAt));
    const id = setInterval(() => setState(remaining(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  // Avant montage : rien (évite un mismatch d'hydratation).
  return (
    <span className={className}>{state ? state.text : "—"}</span>
  );
}
