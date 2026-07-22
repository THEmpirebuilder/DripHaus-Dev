export const metadata = { title: "Créer un compte" };

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl font-semibold">Créer un compte</h1>
      {/*
        Le rôle (particulier | createur | boutique) se transmet dans les
        metadata du signup : supabase.auth.signUp({ options: { data: { role } } }).
        Le trigger on_auth_user_created crée alors public.users + public.profiles.
      */}
    </main>
  );
}
