"use client";

import { useActionState } from "react";
import {
  createArticleAction,
  updateArticleAction,
  type ArticleFormState,
} from "@/lib/actions/articles";
import type { Tables } from "@/types/database";
import type { Category } from "@/lib/queries/categories";
import { toImageUrls } from "@/lib/utils/media";
import { ImageUploader } from "@/components/article/image-uploader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: ArticleFormState = {};

const CONDITIONS = [
  { value: "new", label: "Neuf" },
  { value: "very_good", label: "Très bon état" },
  { value: "good", label: "Bon état" },
  { value: "fair", label: "État correct" },
];

export type SellerOption = { value: string; label: string };

export function ArticleForm({
  userId,
  sellerOptions,
  categories,
  article,
}: {
  userId: string;
  sellerOptions: SellerOption[];
  categories: Category[];
  article?: Tables<"articles">;
}) {
  const isEdit = Boolean(article);
  const [state, formAction] = useActionState(
    isEdit ? updateArticleAction : createArticleAction,
    initial
  );

  const defaultSeller = article?.seller_boutique_id ?? "user";

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <Alert tone="error">{state.error}</Alert>}
      {article && <input type="hidden" name="article_id" value={article.id} />}

      <div>
        <Label>Photos</Label>
        <ImageUploader userId={userId} initial={article ? toImageUrls(article.images) : []} />
      </div>

      {sellerOptions.length > 1 && (
        <div>
          <Label htmlFor="seller">Vendre en tant que</Label>
          <Select id="seller" name="seller" defaultValue={defaultSeller}>
            {sellerOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      )}
      {sellerOptions.length <= 1 && <input type="hidden" name="seller" value="user" />}

      <div>
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" required defaultValue={article?.title ?? ""} placeholder="Veste en laine vintage" />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={article?.description ?? ""} placeholder="Matière, coupe, défauts éventuels…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="price">Prix (CHF)</Label>
          <Input id="price" name="price" type="number" step="0.05" min="0.05" required defaultValue={article?.price ?? ""} />
        </div>
        <div>
          <Label htmlFor="condition">État</Label>
          <Select id="condition" name="condition" defaultValue={article?.condition ?? ""}>
            <option value="">—</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category_id">Catégorie</Label>
          <Select id="category_id" name="category_id" defaultValue={article?.category_id ?? ""}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="brand">Marque</Label>
          <Input id="brand" name="brand" defaultValue={article?.brand ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="size">Taille</Label>
          <Input id="size" name="size" defaultValue={article?.size ?? ""} placeholder="M / 38 / 42" />
        </div>
        <div>
          <Label htmlFor="color">Couleur</Label>
          <Input id="color" name="color" defaultValue={article?.color ?? ""} />
        </div>
        <div>
          <Label htmlFor="location">Localisation</Label>
          <Input id="location" name="location" defaultValue={article?.location ?? ""} placeholder="Genève" />
        </div>
      </div>

      <div>
        <Label htmlFor="status">Visibilité</Label>
        <Select id="status" name="status" defaultValue={article?.status === "draft" ? "draft" : "active"}>
          <option value="active">Publié</option>
          <option value="draft">Brouillon</option>
        </Select>
      </div>

      <SubmitButton pendingLabel="Enregistrement…">
        {isEdit ? "Enregistrer" : "Publier l'article"}
      </SubmitButton>
    </form>
  );
}
