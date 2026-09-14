/**
 * Registre des skills du Studio IA — SOURCE DE VÉRITÉ de la palette A→L.
 *
 * Décision d'architecture (cf. cerveau/STUDIO_IA_STOCKAGE_DONNEES.md §2) : le
 * registre vit en CODE, pas en base. La base ne stocke que l'usage (studio_jobs,
 * studio_assets) ; ici on décrit les CAPACITÉS : type (Agent/Skill/Asset),
 * famille, poids de crédits, moteur par défaut (API vs self-host), et si un
 * brouillon basse-déf gratuit est possible.
 *
 * Un `studio_jobs.skill` référence une `key` ci-dessous. Changer de moteur =
 * éditer `engine`/`provider` ici, sans toucher ni l'app ni le schéma (l'app
 * n'appelle jamais les modèles — elle enfile un job pour l'Engine).
 *
 * Poids de crédits : ancrage 1 crédit ≈ $0.04 (archi §7bis). Le brouillon est
 * offert/quasi ; SEUL le rendu final HD consomme `credits`.
 * Module pur (importable client & serveur) — aucune dépendance runtime.
 */

export type SkillType = "agent" | "skill" | "asset";
export type FamilyId =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";
export type Provider = "api" | "self-host" | "hybrid" | "infra";
/** `live` = câblé aujourd'hui (famille G, texte). `planned` = UI prête, Engine à venir. */
export type SkillStatus = "live" | "planned";

export type StudioSkill = {
  key: string;
  family: FamilyId;
  type: SkillType;
  label: string;
  hint: string;
  /** Coût pondéré d'un rendu FINAL, en crédits. 0 = infra/agent (le sous-jacent est facturé). */
  credits: number;
  /** Un brouillon basse-déf gratuit est-il possible avant le rendu final ? */
  draftable: boolean;
  provider: Provider;
  /** Moteur par défaut (audit + swap). Sans objet pour l'infra pure. */
  engine?: string;
  status: SkillStatus;
};

export type StudioFamily = {
  id: FamilyId;
  label: string;
  tagline: string;
  /** Type dominant, affiché sur l'étape du rail. */
  type: SkillType;
  skills: StudioSkill[];
};

export const FAMILIES: StudioFamily[] = [
  {
    id: "A",
    label: "Ingestion",
    tagline: "Détourage · OCR étiquette · packshot",
    type: "skill",
    skills: [
      { key: "ingest.upload", family: "A", type: "skill", label: "Upload multi-photos", hint: "Packshot, porté, à plat, détails, étiquette.", credits: 0, draftable: false, provider: "infra", status: "planned" },
      { key: "ingest.removebg", family: "A", type: "skill", label: "Détourage auto", hint: "Masque propre — prérequis de l'essayage.", credits: 0.2, draftable: false, provider: "self-host", engine: "birefnet", status: "planned" },
      { key: "ingest.ocr", family: "A", type: "skill", label: "OCR étiquette", hint: "Composition, taille, marque, entretien.", credits: 0.2, draftable: false, provider: "hybrid", engine: "qwen3-vl", status: "planned" },
      { key: "ingest.packshot", family: "A", type: "skill", label: "Normalisation packshot", hint: "Fond neutre standardisé, cohérent.", credits: 0.4, draftable: true, provider: "api", engine: "nano-banana", status: "planned" },
      { key: "ingest.upscale", family: "A", type: "skill", label: "Upscale input", hint: "Rehausse une photo smartphone médiocre.", credits: 0.5, draftable: false, provider: "self-host", engine: "supir", status: "planned" },
      { key: "ingest.detect", family: "A", type: "skill", label: "Détection & auto-tag", hint: "Catégorie, tags, multi-pièces.", credits: 0.2, draftable: false, provider: "self-host", engine: "groundingdino", status: "planned" },
    ],
  },
  {
    id: "B",
    label: "Compréhension",
    tagline: "Attributs JSON · palette · état",
    type: "skill",
    skills: [
      { key: "understand.attributes", family: "B", type: "skill", label: "Attributs → JSON", hint: "Coupe, matière, motif, zones à préserver.", credits: 0.2, draftable: false, provider: "hybrid", engine: "qwen3-vl", status: "planned" },
      { key: "understand.palette", family: "B", type: "skill", label: "Palette couleur", hint: "Couleurs dominantes — filtres & matching.", credits: 0.1, draftable: false, provider: "self-host", engine: "k-means", status: "planned" },
      { key: "understand.condition", family: "B", type: "skill", label: "État (proposition)", hint: "Neuf / très bon / bon — à valider.", credits: 0.2, draftable: false, provider: "api", engine: "gemini-2.5", status: "planned" },
      { key: "understand.size", family: "B", type: "skill", label: "Estimation taille", hint: "Aide à déduire la taille depuis la photo.", credits: 0.2, draftable: false, provider: "api", engine: "gemini-2.5", status: "planned" },
    ],
  },
  {
    id: "C",
    label: "Mannequin",
    tagline: "Catalogue · identité verrouillée",
    type: "asset",
    skills: [
      { key: "mannequin.catalog", family: "C", type: "asset", label: "Catalogue inclusif", hint: "Mannequins persistants, morphotypes variés.", credits: 0, draftable: false, provider: "infra", status: "planned" },
      { key: "mannequin.sheet", family: "C", type: "skill", label: "Character-sheet", hint: "Fige toutes les vues d'un mannequin.", credits: 3, draftable: true, provider: "self-host", engine: "instantcharacter", status: "planned" },
      { key: "mannequin.custom", family: "C", type: "skill", label: "Mannequin custom", hint: "Avatar du vendeur — consentement requis.", credits: 4, draftable: true, provider: "self-host", engine: "infiniteyou", status: "planned" },
      { key: "mannequin.pose", family: "C", type: "asset", label: "Bibliothèque de poses", hint: "Poses paramétrables, identité conservée.", credits: 0, draftable: false, provider: "self-host", engine: "dwpose", status: "planned" },
    ],
  },
  {
    id: "D",
    label: "Essayage",
    tagline: "Try-on · look complet · fit",
    type: "skill",
    skills: [
      { key: "tryon.image", family: "D", type: "skill", label: "Essayage image", hint: "Fusion mannequin + vêtement, haute fidélité.", credits: 2, draftable: true, provider: "api", engine: "fashn", status: "planned" },
      { key: "tryon.look", family: "D", type: "skill", label: "Look complet", hint: "Haut + bas + chaussures, layering.", credits: 3, draftable: true, provider: "api", engine: "fashn", status: "planned" },
      { key: "tryon.morphos", family: "D", type: "skill", label: "Multi-morphotypes", hint: "La même pièce sur plusieurs silhouettes.", credits: 3, draftable: true, provider: "api", engine: "fashn", status: "planned" },
      { key: "tryon.fit", family: "D", type: "skill", label: "Ajustement du fit", hint: "Oversize / ajusté / taille réelle.", credits: 2, draftable: true, provider: "api", engine: "fashn", status: "planned" },
    ],
  },
  {
    id: "E",
    label: "Scène",
    tagline: "Décor · lumière · lookbook",
    type: "skill",
    skills: [
      { key: "scene.render", family: "E", type: "skill", label: "Mise en scène", hint: "Décor, lumière, cadrage, ambiance.", credits: 1, draftable: true, provider: "api", engine: "seedream-4.5", status: "planned" },
      { key: "scene.lookbook", family: "E", type: "skill", label: "Cohérence lookbook", hint: "Même DA sur N pièces d'une collection.", credits: 3, draftable: true, provider: "api", engine: "seedream-4.5", status: "planned" },
      { key: "scene.multiangle", family: "E", type: "skill", label: "Set multi-angles", hint: "Pied, ¾, macro matière — fiche complète.", credits: 2, draftable: true, provider: "api", engine: "nano-banana", status: "planned" },
      { key: "scene.decors", family: "E", type: "asset", label: "Bibliothèque de décors", hint: "Décors bornés par templates validés.", credits: 0, draftable: false, provider: "infra", status: "planned" },
    ],
  },
  {
    id: "F",
    label: "Vidéo",
    tagline: "I2V · micro-clip · reels",
    type: "skill",
    skills: [
      { key: "video.i2v", family: "F", type: "skill", label: "Image → vidéo", hint: "Depuis une image canonique figée.", credits: 12, draftable: false, provider: "api", engine: "kling-2.6", status: "planned" },
      { key: "video.clip", family: "F", type: "skill", label: "Micro-clip / 360°", hint: "Rotation, marche, mouvement du tissu.", credits: 12, draftable: false, provider: "api", engine: "kling-2.6", status: "planned" },
      { key: "video.catwalk", family: "F", type: "skill", label: "Défilé / catwalk", hint: "Marche podium — format premium.", credits: 19, draftable: false, provider: "api", engine: "veo-3.1", status: "planned" },
      { key: "video.reel", family: "F", type: "skill", label: "Reel / story", hint: "9:16, musique tendance, sous-titres.", credits: 14, draftable: false, provider: "api", engine: "veo-3.1", status: "planned" },
    ],
  },
  {
    id: "G",
    label: "Texte",
    tagline: "Caption · SEO · description",
    type: "skill",
    skills: [
      { key: "text.product", family: "G", type: "skill", label: "Description produit", hint: "Caractéristiques → texte de vente.", credits: 0.1, draftable: false, provider: "api", engine: "claude-sonnet-5", status: "live" },
      { key: "text.caption", family: "G", type: "skill", label: "Légende de post", hint: "Légende + hashtags pour le feed.", credits: 0.1, draftable: false, provider: "api", engine: "claude-sonnet-5", status: "live" },
      { key: "text.seo", family: "G", type: "skill", label: "Titre & meta SEO", hint: "Optimise le référencement de l'annonce.", credits: 0.1, draftable: false, provider: "api", engine: "claude-sonnet-5", status: "live" },
      { key: "text.translate", family: "G", type: "skill", label: "Multilingue FR/DE/IT/EN", hint: "Localisation, pas mot-à-mot.", credits: 0.1, draftable: false, provider: "api", engine: "claude-sonnet-5", status: "planned" },
    ],
  },
  {
    id: "H",
    label: "Branding",
    tagline: "Thème boutique · cover · presets",
    type: "asset",
    skills: [
      { key: "brand.theme", family: "H", type: "skill", label: "Thème de vitrine", hint: "Logo/site → palette + typo → tokens.", credits: 1, draftable: true, provider: "api", engine: "gemini-2.5", status: "planned" },
      { key: "brand.cover", family: "H", type: "skill", label: "Cover & OG", hint: "Bannière boutique + images de partage.", credits: 1, draftable: true, provider: "api", engine: "ideogram", status: "planned" },
      { key: "brand.preset", family: "H", type: "asset", label: "Preset de marque", hint: "Style appliqué à tous les visuels.", credits: 0, draftable: false, provider: "infra", status: "planned" },
      { key: "brand.logo", family: "H", type: "skill", label: "Logo & kit social", hint: "Pour un vendeur sans identité visuelle.", credits: 1, draftable: true, provider: "api", engine: "ideogram", status: "planned" },
    ],
  },
  {
    id: "I",
    label: "Post-prod",
    tagline: "Filigrane · reframe · export",
    type: "skill",
    skills: [
      { key: "post.watermark", family: "I", type: "skill", label: "Filigrane & mention IA", hint: "À l'export externe, sauf abonnement.", credits: 0, draftable: false, provider: "infra", status: "planned" },
      { key: "post.inpaint", family: "I", type: "skill", label: "Retouche localisée", hint: "Inpainting : défaut, variante couleur.", credits: 1, draftable: true, provider: "api", engine: "nano-banana", status: "planned" },
      { key: "post.reframe", family: "I", type: "skill", label: "Reframe multi-format", hint: "1:1, 4:5, 9:16, 16:9, OG 1200×630.", credits: 0.3, draftable: false, provider: "api", engine: "flux2-fill", status: "planned" },
      { key: "post.batch", family: "I", type: "skill", label: "Batch export", hint: "Lot multi-plateforme, print-ready.", credits: 0.5, draftable: false, provider: "self-host", engine: "real-esrgan", status: "planned" },
    ],
  },
  {
    id: "J",
    label: "Gouvernance",
    tagline: "Queue · crédits · QA",
    type: "agent",
    skills: [
      { key: "gov.queue", family: "J", type: "skill", label: "Queue & retry", hint: "File d'exécution des jobs asynchrones.", credits: 0, draftable: false, provider: "infra", status: "planned" },
      { key: "gov.contract", family: "J", type: "asset", label: "Contrat d'assets", hint: "Métadonnées inter-couches, rejouable.", credits: 0, draftable: false, provider: "infra", status: "planned" },
      { key: "gov.qa", family: "J", type: "skill", label: "QA auto-bloquante", hint: "Dérive visage, fit, logo, couleur.", credits: 0, draftable: false, provider: "hybrid", engine: "qwen3-vl", status: "planned" },
      { key: "gov.credits", family: "J", type: "skill", label: "Crédits pondérés", hint: "Décompte par coût réel + garde-fous.", credits: 0, draftable: false, provider: "infra", status: "planned" },
    ],
  },
  {
    id: "K",
    label: "Agent",
    tagline: "Assistant · auto-pilote",
    type: "agent",
    skills: [
      { key: "agent.assistant", family: "K", type: "agent", label: "Assistant conversationnel", hint: "Orchestre A→L en langage naturel.", credits: 0, draftable: false, provider: "api", engine: "claude-sonnet-5", status: "planned" },
      { key: "agent.autopilot", family: "K", type: "agent", label: "Auto-pilote packshot→lookbook", hint: "La chaîne complète en un clic.", credits: 0, draftable: false, provider: "api", engine: "claude-sonnet-5", status: "planned" },
      { key: "agent.scoring", family: "K", type: "skill", label: "Reco & scoring virality", hint: "Conseille le rendu, estime le potentiel.", credits: 0.2, draftable: false, provider: "api", engine: "fashion-clip", status: "planned" },
    ],
  },
  {
    id: "L",
    label: "Matching",
    tagline: "Complète le look · shop the look",
    type: "agent",
    skills: [
      { key: "match.complete", family: "L", type: "agent", label: "Complète la tenue", hint: "Le vêtement manquant, choisi avec goût.", credits: 0.2, draftable: false, provider: "api", engine: "claude-sonnet-5", status: "planned" },
      { key: "match.inventory", family: "L", type: "skill", label: "Matching inventaire", hint: "Depuis les pièces réellement en vente.", credits: 0.1, draftable: false, provider: "self-host", engine: "marqo-fashionsiglip", status: "planned" },
      { key: "match.shop", family: "L", type: "skill", label: "Shop the look", hint: "Chaque pièce du visuel, achetable.", credits: 0, draftable: false, provider: "self-host", engine: "sam-3", status: "planned" },
      { key: "match.bundles", family: "L", type: "agent", label: "Bundles", hint: "Tenues à acheter ensemble.", credits: 0.2, draftable: false, provider: "api", engine: "claude-sonnet-5", status: "planned" },
    ],
  },
];

/** Ordre du rail « du packshot au lookbook ». K (agent) et J (gouvernance) vivent
 *  dans la chrome (dock assistant / barre d'outils), pas comme étapes du pipeline. */
export const PIPELINE_ORDER: FamilyId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "L"];

export const FAMILY_BY_ID: Record<FamilyId, StudioFamily> = Object.fromEntries(
  FAMILIES.map((f) => [f.id, f])
) as Record<FamilyId, StudioFamily>;

/** Étapes du rail, dans l'ordre du pipeline, indexées pour l'affichage. */
export function pipelineSteps(): StudioFamily[] {
  return PIPELINE_ORDER.map((id) => FAMILY_BY_ID[id]);
}

/** Retrouve une skill par sa clé (validation d'un studio_jobs.skill). */
export function skillByKey(key: string): StudioSkill | undefined {
  for (const fam of FAMILIES) {
    const s = fam.skills.find((sk) => sk.key === key);
    if (s) return s;
  }
  return undefined;
}

export const TYPE_LABEL: Record<SkillType, string> = {
  agent: "Agent",
  skill: "Skill",
  asset: "Asset",
};
