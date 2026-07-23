"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/lib/actions/social";
import type { FollowTarget } from "@/lib/queries/follows";
import { Button } from "@/components/ui/button";

export function FollowButton({
  target,
  initialFollowing,
}: {
  target: FollowTarget;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await toggleFollow(target);
      setFollowing(res.following);
    });
  }

  return (
    <Button
      type="button"
      variant={following ? "outline" : "primary"}
      size="sm"
      disabled={pending}
      onClick={onClick}
    >
      {following ? "Suivi" : "Suivre"}
    </Button>
  );
}
