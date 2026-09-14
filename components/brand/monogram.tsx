import { cn } from "@/lib/utils/cn";

/*
  Logo DripHaus — artwork officiel (dossier de marque « Logo 6A »).
  Losange or dégradé + piqûre couture + VOILE de mini-monogrammes DH (le « damier »,
  reconstruit ici car absent des SVG vectoriels fournis, présent sur la planche) +
  monogramme DH lié (Italianno). Pas de « STORE » (retiré du logo de base).
  Les polices sont celles chargées par l'app (next/font).
  En thème sombre, le H passe en or clair (.dh-ink).
  Le voile n'apparaît qu'au-dessus de ~40 px (charte : retiré en petit).
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

const ITALIANNO = { fontFamily: "var(--font-italianno), Italianno, cursive" } as const;

/* Voile : tuilage staggered de petits « DH », clippé au losange (le damier). */
const VEIL = (() => {
  const cells = [];
  for (let r = 0; r < 7; r++) {
    const y = 30 + r * 15.5;
    const off = r % 2 ? 11 : 0;
    for (let c = 0; c < 6; c++) {
      cells.push(
        <text key={`v${r}-${c}`} x={6 + off + c * 22} y={y} fontSize="12" fill="#C9A24A" opacity="0.15" style={ITALIANNO}>
          DH
        </text>
      );
    }
  }
  return cells;
})();

const DIAMOND = "M75 8 C 92 30, 118 53, 141 74 C 119 95, 95 119, 74 142 C 55 120, 30 96, 9 75 C 31 54, 55 30, 75 8 Z";

/** Cœur graphique du losange (partagé). `grad` = id de dégradé unique par usage.
 *  `store` : réintègre la mention « STORE » du logo fourni (retirée par défaut). */
function DiamondArt({ grad, veil = true, store = false }: { grad: string; veil?: boolean; store?: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="1" y2="1">{STOPS}</linearGradient>
        {veil && (
          <clipPath id={`${grad}-clip`}>
            <path d={DIAMOND} />
          </clipPath>
        )}
      </defs>
      <g transform="rotate(-1.5 75 75)">
        <path d={DIAMOND} fill="none" stroke="#B08F3C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M141 74 C 119 95, 95 119, 74 142" fill="none" stroke={`url(#${grad})`} strokeWidth="9" strokeLinecap="round" />
        <path d="M9 75 C 31 54, 55 30, 75 8" fill="none" stroke={`url(#${grad})`} strokeWidth="7" strokeLinecap="round" />
        <path d="M75 22 C 90 41, 112 60, 132 75 C 112 93, 91 113, 74 133 C 58 114, 36 94, 18 75 C 36 57, 58 39, 75 22 Z" fill="none" stroke="#B08F3C" strokeWidth="1" strokeDasharray="4 8" strokeLinecap="round" opacity="0.75" />
        {veil && <g clipPath={`url(#${grad}-clip)`}>{VEIL}</g>}
        <text x="60" y="86" fontSize="74" fill={`url(#${grad})`} style={ITALIANNO}>D</text>
        <text x="79" y="93" fontSize="74" fill="#5C3F1C" className="dh-ink" style={ITALIANNO}>H</text>
        {store && (
          <>
            <path d="M56 100 h38" stroke={`url(#${grad})`} strokeWidth="0.9" className="dh-ink" />
            <text x="63" y="110" fontSize="5.2" letterSpacing="1.8" fill="#5C3F1C" className="dh-ink" style={{ fontFamily: "var(--font-syne), sans-serif" }}>STORE</text>
          </>
        )}
      </g>
    </>
  );
}

/** Monogramme seul : losange or + voile + DH lié. Carré, transparent. */
export function Monogram({ size = 40, className, title = "DripHaus" }: { size?: number; className?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" role="img" aria-label={title} className={className}>
      <DiamondArt grad="dh-gold-m" veil={size >= 40} />
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
      <DiamondArt grad="dh-gold-h" veil />
      <text x="176" y="86" fontSize="34" letterSpacing="11.5" fill="url(#dh-gold-h)" style={{ fontFamily: "var(--font-italiana), serif" }}>DRIPHAUS</text>
    </svg>
  );
}
