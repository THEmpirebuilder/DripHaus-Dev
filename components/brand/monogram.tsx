import { cn } from "@/lib/utils/cn";

/*
  Logo DripHaus — artwork officiel fourni par l'associé (dossier de marque, « Logo 6A »).
  Transcription fidèle des SVG livrés (logo-driphaus-horizontal.svg / monogramme) :
  losange or dégradé + piqûre couture + monogramme DH lié (Italianno) + wordmark DRIPHAUS
  (Italiana). Les polices sont celles déjà chargées par l'app (next/font), donc le rendu
  est identique au fichier source, tout en restant vectoriel et thème-aware.

  En thème sombre, les parties encre du monogramme (H, filet, STORE) passent en or clair
  (classe .dh-ink → règle dans globals.css) pour rester lisibles sur fond sombre.
*/

const STOPS = (
  <>
    <stop offset="0" stopColor="#7E5730" />
    <stop offset="0.22" stopColor="#A87C3C" />
    <stop offset="0.45" stopColor="#E8CE94" />
    <stop offset="0.55" stopColor="#D8B265" />
    <stop offset="0.75" stopColor="#9A7134" />
    <stop offset="1" stopColor="#6E4A26" />
  </>
);

/** Monogramme seul : losange or + DH lié. Carré, transparent. */
export function Monogram({ size = 40, className, title = "DripHaus" }: { size?: number; className?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" role="img" aria-label={title} className={className}>
      <defs>
        <linearGradient id="dh-gold-m" x1="0" y1="0" x2="1" y2="1">{STOPS}</linearGradient>
      </defs>
      <g transform="rotate(-1.5 75 75)">
        <path d="M75 8 C 92 30, 118 53, 141 74 C 119 95, 95 119, 74 142 C 55 120, 30 96, 9 75 C 31 54, 55 30, 75 8 Z" fill="none" stroke="#B08F3C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M141 74 C 119 95, 95 119, 74 142" fill="none" stroke="url(#dh-gold-m)" strokeWidth="9" strokeLinecap="round" />
        <path d="M9 75 C 31 54, 55 30, 75 8" fill="none" stroke="url(#dh-gold-m)" strokeWidth="7" strokeLinecap="round" />
        <path d="M75 22 C 90 41, 112 60, 132 75 C 112 93, 91 113, 74 133 C 58 114, 36 94, 18 75 C 36 57, 58 39, 75 22 Z" fill="none" stroke="#B08F3C" strokeWidth="1" strokeDasharray="4 8" strokeLinecap="round" opacity="0.75" />
        <text x="60" y="86" fontSize="74" fill="url(#dh-gold-m)" style={{ fontFamily: "var(--font-italianno), Italianno, cursive" }}>D</text>
        <text x="79" y="93" fontSize="74" fill="#5C3F1C" className="dh-ink" style={{ fontFamily: "var(--font-italianno), Italianno, cursive" }}>H</text>
        <path d="M56 100 h38" stroke="url(#dh-gold-m)" strokeWidth="0.9" className="dh-ink" />
        <text x="63" y="110" fontSize="5.2" letterSpacing="1.8" fill="#5C3F1C" className="dh-ink" style={{ fontFamily: "var(--font-syne), sans-serif" }}>STORE</text>
      </g>
    </svg>
  );
}

/** Logo vertical : monogramme (grand) au-dessus, wordmark DRIPHAUS dessous. Plus visible. */
export function LogoStacked({ mark = 52, className }: { mark?: number; className?: string }) {
  return (
    <span className={cn("inline-flex flex-col items-center leading-none", className)}>
      <Monogram size={mark} />
      <span
        className="font-serif mt-1.5 leading-none text-foreground"
        style={{ fontSize: Math.max(15, Math.round(mark * 0.32)), letterSpacing: "0.34em", paddingLeft: "0.34em" }}
      >
        DRIPHAUS
      </span>
    </span>
  );
}

/** Logo horizontal officiel : monogramme + wordmark DRIPHAUS. */
export function Logo({ height = 34, className }: { height?: number; className?: string }) {
  const width = Math.round((height * 470) / 150);
  return (
    <svg width={width} height={height} viewBox="0 0 470 150" role="img" aria-label="DripHaus" className={className}>
      <defs>
        <linearGradient id="dh-gold-h" x1="0" y1="0" x2="1" y2="1">{STOPS}</linearGradient>
      </defs>
      <g transform="rotate(-1.5 75 75)">
        <path d="M75 8 C 92 30, 118 53, 141 74 C 119 95, 95 119, 74 142 C 55 120, 30 96, 9 75 C 31 54, 55 30, 75 8 Z" fill="none" stroke="#B08F3C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M141 74 C 119 95, 95 119, 74 142" fill="none" stroke="url(#dh-gold-h)" strokeWidth="9" strokeLinecap="round" />
        <path d="M9 75 C 31 54, 55 30, 75 8" fill="none" stroke="url(#dh-gold-h)" strokeWidth="7" strokeLinecap="round" />
        <path d="M75 22 C 90 41, 112 60, 132 75 C 112 93, 91 113, 74 133 C 58 114, 36 94, 18 75 C 36 57, 58 39, 75 22 Z" fill="none" stroke="#B08F3C" strokeWidth="1" strokeDasharray="4 8" strokeLinecap="round" opacity="0.75" />
        <text x="60" y="86" fontSize="74" fill="url(#dh-gold-h)" style={{ fontFamily: "var(--font-italianno), Italianno, cursive" }}>D</text>
        <text x="79" y="93" fontSize="74" fill="#5C3F1C" className="dh-ink" style={{ fontFamily: "var(--font-italianno), Italianno, cursive" }}>H</text>
        <path d="M56 100 h38" stroke="url(#dh-gold-h)" strokeWidth="0.9" className="dh-ink" />
        <text x="63" y="110" fontSize="5.2" letterSpacing="1.8" fill="#5C3F1C" className="dh-ink" style={{ fontFamily: "var(--font-syne), sans-serif" }}>STORE</text>
      </g>
      <text x="176" y="86" fontSize="34" letterSpacing="11.5" fill="url(#dh-gold-h)" style={{ fontFamily: "var(--font-italiana), serif" }}>DRIPHAUS</text>
    </svg>
  );
}
