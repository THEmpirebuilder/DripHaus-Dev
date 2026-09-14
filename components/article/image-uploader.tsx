"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { uploadMedia } from "@/lib/storage/media";
import { Button } from "@/components/ui/button";

/**
 * Sélecteur + téléverseur d'images (Supabase Storage, côté navigateur).
 * Émet les URL via un input caché `name` consommé par la Server Action.
 */
export function ImageUploader({
  userId,
  name = "images",
  initial = [],
}: {
  userId: string;
  name?: string;
  initial?: string[];
}) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const list = Array.from(files);

    startTransition(async () => {
      try {
        const uploaded = await Promise.all(list.map((f) => uploadMedia(f, userId)));
        setUrls((prev) => [...prev, ...uploaded]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec du téléversement.");
      }
    });
  }

  function remove(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(urls)} />

      <div className="flex flex-wrap gap-3">
        {urls.map((url) => (
          <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
            <Image src={url} alt="" fill sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-paper"
              aria-label="Retirer l'image"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
            </button>
          </div>
        ))}

        <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted hover:bg-surface-elevated">
          {pending ? "…" : "+ Ajouter"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={pending}
          />
        </label>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
