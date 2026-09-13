import { cn } from "@/lib/utils/cn";

/**
 * Monogramme DripHaus — losange or sur encre, D/H en Italianno.
 * Reproduction fidèle de l'artwork de la charte (Logo 6A / monogramme-driphaus.svg).
 * Sous 32 px, le voile et la piqûre sont retirés (ici déjà simplifié) ; sous 20 px,
 * ne garder que le losange (passer withLetters={false}).
 */
export function Monogram({
  size = 36,
  withLetters = true,
  className,
  title = "DripHaus",
}: {
  size?: number;
  withLetters?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      role="img"
      aria-label={title}
      className={className}
    >
      <rect width="180" height="180" fill="#14130F" />
      <g transform="translate(15 15)">
        <g transform="rotate(-1.5 75 75)">
          <path
            d="M75 8 C 92 30, 118 53, 141 74 C 119 95, 95 119, 74 142 C 55 120, 30 96, 9 75 C 31 54, 55 30, 75 8 Z"
            fill="none"
            stroke="#D9B563"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M141 74 C 119 95, 95 119, 74 142" fill="none" stroke="#E8CE94" strokeWidth="11" strokeLinecap="round" />
          <path d="M9 75 C 31 54, 55 30, 75 8" fill="none" stroke="#E8CE94" strokeWidth="9" strokeLinecap="round" />
          {withLetters && (
            <>
              <text x="58" y="90" fontSize="80" fill="#E8CE94" style={{ fontFamily: "var(--font-italianno), Italianno, cursive" }}>
                D
              </text>
              <text x="79" y="97" fontSize="80" fill="#A97B3E" style={{ fontFamily: "var(--font-italianno), Italianno, cursive" }}>
                H
              </text>
            </>
          )}
        </g>
      </g>
    </svg>
  );
}

/** Logo horizontal : monogramme + wordmark Italiana. */
export function Logo({
  size = 34,
  withWordmark = true,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Monogram size={size} />
      {withWordmark && (
        <span className="font-serif text-xl tracking-[0.3em] text-foreground">DRIPHAUS</span>
      )}
    </span>
  );
}
