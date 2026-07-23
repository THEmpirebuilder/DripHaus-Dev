"use client";

import { useActionState } from "react";
import { createPostAction, type PostFormState } from "@/lib/actions/social";
import { ImageUploader } from "@/components/article/image-uploader";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card } from "@/components/ui/card";

const initial: PostFormState = {};

export type AuthorOption = { value: string; label: string };

export function PostComposer({
  userId,
  authorOptions,
}: {
  userId: string;
  authorOptions: AuthorOption[];
}) {
  const [state, formAction] = useActionState(createPostAction, initial);

  return (
    <Card className="p-5">
      <form action={formAction} className="space-y-3">
        {state.error && <Alert tone="error">{state.error}</Alert>}

        {authorOptions.length > 1 ? (
          <Select name="author" defaultValue="user" aria-label="Publier en tant que">
            {authorOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ) : (
          <input type="hidden" name="author" value="user" />
        )}

        <Textarea name="content" placeholder="Quoi de neuf dans ton dressing ?" />
        <ImageUploader userId={userId} />

        <div className="flex justify-end">
          <SubmitButton pendingLabel="Publication…">Publier</SubmitButton>
        </div>
      </form>
    </Card>
  );
}
