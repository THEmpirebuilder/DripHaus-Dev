"use client";

import { useState } from "react";
import Image from "next/image";

/** Galerie produit : image principale + miniatures cliquables. Présentation. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden border border-border bg-surface-elevated">
        {main ? (
          <Image src={main} alt={alt} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover" priority />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">Sans photo</div>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Vue ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-square overflow-hidden border bg-surface-elevated transition-colors ${i === active ? "border-accent" : "border-border hover:border-accent/50"}`}
            >
              <Image src={url} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
