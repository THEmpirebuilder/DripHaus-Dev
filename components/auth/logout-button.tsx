import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

/**
 * Bouton de déconnexion. Server Action branchée directement sur le formulaire
 * (pas de JS client nécessaire).
 */
export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm">
        Se déconnecter
      </Button>
    </form>
  );
}
