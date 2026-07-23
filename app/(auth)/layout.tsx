import { Card } from "@/components/ui/card";

/** Cadre centré partagé par les écrans d'authentification. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-6 py-12">
      <Card className="w-full">{children}</Card>
    </main>
  );
}
