import { requireUser } from "@/lib/auth/session";
import { getMatchingSuggestions } from "@/lib/queries/studio";
import { StudioWorkstation } from "@/components/studio/studio-workstation";

export const metadata = { title: "Studio IA" };

/**
 * Page Studio IA — poste de travail hybride (rail A→L · canvas · dock).
 * Server Component mince : lit la session (le rôle pilote le défaut de persona)
 * et un échantillon réel du catalogue pour le matching (famille L), puis délègue.
 */
export default async function StudioPage() {
  const user = await requireUser();
  const matches = await getMatchingSuggestions(3);

  return <StudioWorkstation persona={user.account.role} matches={matches} />;
}
