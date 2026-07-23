"use client";

import { useActionState } from "react";
import Link from "next/link";
import { addCommentAction, deleteCommentAction, type CommentFormState } from "@/lib/actions/social";
import type { CommentWithAuthor } from "@/lib/queries/posts";
import { formatDateTime } from "@/lib/utils/format";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: CommentFormState = {};

export function CommentSection({
  postId,
  comments,
  currentUserId,
}: {
  postId: string;
  comments: CommentWithAuthor[];
  currentUserId: string | null;
}) {
  const [state, formAction] = useActionState(addCommentAction, initial);

  return (
    <div className="space-y-6">
      {currentUserId ? (
        <form action={formAction} className="space-y-2">
          {state.error && <Alert tone="error">{state.error}</Alert>}
          <input type="hidden" name="post_id" value={postId} />
          <Textarea name="content" placeholder="Ajouter un commentaire…" required />
          <div className="flex justify-end">
            <SubmitButton size="sm" pendingLabel="Envoi…">Commenter</SubmitButton>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted">
          <Link href="/login" className="underline underline-offset-4">Connecte-toi</Link> pour commenter.
        </p>
      )}

      <ul className="space-y-4">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Avatar src={c.author?.avatarUrl} name={c.author?.name} size={32} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {c.author ? (
                  <Link href={c.author.href} className="text-sm font-medium hover:underline">
                    {c.author.name}
                  </Link>
                ) : (
                  <span className="text-sm font-medium">Utilisateur</span>
                )}
                <span className="text-xs text-muted">{formatDateTime(c.created_at)}</span>
              </div>
              <p className="mt-0.5 whitespace-pre-line text-sm">{c.content}</p>
            </div>
            {c.user_id === currentUserId && (
              <form action={deleteCommentAction}>
                <input type="hidden" name="comment_id" value={c.id} />
                <input type="hidden" name="post_id" value={postId} />
                <Button type="submit" variant="ghost" size="sm">Supprimer</Button>
              </form>
            )}
          </li>
        ))}
        {comments.length === 0 && <p className="text-sm text-muted">Sois le premier à commenter.</p>}
      </ul>
    </div>
  );
}
