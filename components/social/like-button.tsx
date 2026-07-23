"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/lib/actions/social";
import { cn } from "@/lib/utils/cn";

export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function onClick() {
    // Optimiste : on bascule tout de suite, on réconcilie avec le serveur.
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));

    startTransition(async () => {
      const res = await toggleLike(postId);
      setLiked(res.liked);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm transition",
        liked ? "text-destructive" : "text-muted hover:text-foreground"
      )}
      aria-pressed={liked}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
