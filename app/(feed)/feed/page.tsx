import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Feed" };
export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, content, type, media, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Feed</h1>

      {error && <p className="mt-6 text-sm text-red-600">{error.message}</p>}

      {!error && posts?.length === 0 && (
        <p className="mt-6 opacity-60">Le feed est encore vide.</p>
      )}

      <ul className="mt-10 space-y-6">
        {posts?.map((p) => (
          <li key={p.id} className="rounded-lg border border-black/10 p-5 dark:border-white/15">
            <p className="text-xs uppercase tracking-wide opacity-50">{p.type}</p>
            {p.content && <p className="mt-2">{p.content}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
