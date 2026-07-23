"use server";

import { requireUser } from "@/lib/auth/session";
import { runStudio, type StudioTool } from "@/lib/ai/studio";

export type StudioFormState = { output?: string; error?: string; tool?: StudioTool };

const TOOLS: StudioTool[] = ["caption", "seo", "product"];

function isTool(v: string): v is StudioTool {
  return (TOOLS as string[]).includes(v);
}

/** Exécute un outil du Studio IA sur le texte fourni. */
export async function runStudioAction(
  _prev: StudioFormState,
  formData: FormData
): Promise<StudioFormState> {
  await requireUser();

  const tool = String(formData.get("tool") ?? "");
  const input = String(formData.get("input") ?? "").trim();

  if (!isTool(tool)) return { error: "Outil inconnu." };
  if (!input) return { error: "Décris ton article pour lancer la génération.", tool };

  try {
    const output = await runStudio(tool, input);
    return { output, tool };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de la génération.";
    // Cas fréquent : gateway IA non configuré (clé manquante).
    return { error: `Génération indisponible : ${message}`, tool };
  }
}
