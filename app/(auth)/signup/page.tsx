import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Créer un compte" };

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/profile");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Créer un compte</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Rejoins la communauté suisse de la mode indépendante.
      </p>
      <SignupForm />
    </div>
  );
}
