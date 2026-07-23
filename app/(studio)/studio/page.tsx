import { requireUser } from "@/lib/auth/session";
import { StudioTool } from "@/components/studio/studio-tool";

export const metadata = { title: "Studio IA" };

export default async function StudioPage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Studio IA</h1>
      <p className="mt-1 mb-8 text-sm text-muted">
        Rédige tes descriptions, légendes et balises SEO en un clic, propulsé par l&apos;IA.
      </p>
      <StudioTool />
    </main>
  );
}
