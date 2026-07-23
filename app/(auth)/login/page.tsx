import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Connexion" };

const NOTICES: Record<string, string> = {
  confirmed: "Adresse confirmée. Tu peux maintenant te connecter.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  if (await getSessionUser()) redirect("/profile");

  const { notice, error } = await searchParams;
  const message = error === "auth" ? "Lien invalide ou expiré. Réessaie de te connecter." : NOTICES[notice ?? ""];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Connexion</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Ravi de te revoir sur DripHaus.</p>
      <LoginForm notice={message} />
    </div>
  );
}
