import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  return { title: handle };
}

export default async function BoutiquePage({ params }: Props) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: boutique } = await supabase
    .from("boutiques")
    .select("id, name, handle, description, logo_url, cover_url, website_url")
    .eq("handle", handle)
    .maybeSingle();

  if (!boutique) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{boutique.name}</h1>
      <p className="mt-1 text-sm opacity-60">@{boutique.handle}</p>
      {boutique.description && <p className="mt-6">{boutique.description}</p>}
    </main>
  );
}
