import "server-only";

import { generateText } from "ai";

/**
 * Modèle par défaut du Studio, routé via le Vercel AI Gateway (chaîne
 * "provider/model"). Changer de modèle = éditer cette constante uniquement.
 */
export const STUDIO_MODEL = "anthropic/claude-sonnet-5";

export type StudioTool = "caption" | "seo" | "product";

const SYSTEM_PROMPTS: Record<StudioTool, string> = {
  caption:
    "Tu es l'assistant social de DripHaus, plateforme suisse de mode indépendante. " +
    "À partir de la description d'un article, rédige une légende de post accrocheuse " +
    "en français (1 à 2 phrases), suivie de 3 à 5 hashtags pertinents (mode, seconde main, " +
    "créateurs, Suisse). Ton chaleureux et authentique. Réponds uniquement avec la légende.",
  seo:
    "Tu es un expert SEO e-commerce mode. À partir des caractéristiques d'un article, " +
    "produis en français : un titre SEO (max 60 caractères) et une meta description " +
    "(max 155 caractères). Formate ainsi :\nTitre : ...\nDescription : ...",
  product:
    "Tu es rédacteur produit pour DripHaus. À partir des caractéristiques fournies " +
    "(marque, matière, taille, état…), rédige une description de vente en français, " +
    "fluide et vendeuse (3 à 4 phrases), sans exagération ni emoji. Réponds uniquement " +
    "avec la description.",
};

/** Génère du contenu via le Studio IA. Peut lever si le gateway n'est pas configuré. */
export async function runStudio(tool: StudioTool, input: string): Promise<string> {
  const { text } = await generateText({
    model: STUDIO_MODEL,
    system: SYSTEM_PROMPTS[tool],
    prompt: input,
  });
  return text.trim();
}
