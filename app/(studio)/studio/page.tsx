import { requireUser } from "@/lib/auth/session";
import { getMatchingSuggestions, getStudioSources } from "@/lib/queries/studio";
import { StudioWorkstation } from "@/components/studio/studio-workstation";

export const metadata = { title: "Studio IA" };

/**
 * Page Studio IA — poste de travail hybride (rail A→L · canvas · dock).
 * Server Component mince : lit la session (le rôle pilote le défaut de persona),
 * un échantillon du catalogue pour le matching (famille L), et les images déjà
 * en ligne de l'utilisateur (réutilisables comme input, famille A), puis délègue.
 */
export default async function StudioPage() {
  const user = await requireUser();
  const [matches, sources] = await Promise.all([
    getMatchingSuggestions(3),
    getStudioSources(user.authId, 12),
  ]);

  return <StudioWorkstation persona={user.account.role} matches={matches} sources={sources} />;
}
