interface LogoProps {
  className?: string
}

/**
 * Share/external-link icon paths (100×100 coordinate space).
 *
 * Square outline open at top-right corner:
 *   Left wall, bottom wall, right wall (partial), top wall (partial)
 *   All strokes are 10 units thick, rendered as filled shapes.
 *
 * Arrow: diagonal shaft from ~center to top-right, with triangular head.
 */
const ICON_SQUARE =
  'M5 5 L50 5 L50 15 L15 15 L15 85 L85 85 L85 50 L95 50 L95 95 L5 95 Z'
const ICON_ARROW =
  'M40 67 L33 60 L65 28 L55 28 L55 5 L95 5 L95 45 L85 45 L85 18 L47 60 Z'

export function Logo({ className = 'h-5' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 520 112"
      fill="currentColor"
      className={className}
    >
      {/* Icon – scaled into a 100×100 area offset to (6, 6) */}
      <g transform="translate(6,6) scale(1)">
        <path d={ICON_SQUARE} fill="currentColor" />
        <path d={ICON_ARROW} fill="currentColor" />
      </g>
      <text
        x="338"
        y="82"
        fontSize="94"
        fontWeight="700"
        textAnchor="middle"
        letterSpacing="2"
        fontFamily="'Space Grotesk', 'Segoe UI', sans-serif"
      >
        SHORTEE
      </text>
    </svg>
  )
}

export function LogoFull({ className = 'h-10' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 520 112"
      fill="currentColor"
      className={className}
      role="img"
      aria-label="Shortee"
    >
      {/* Icon – scaled into a 100×100 area offset to (6, 6) */}
      <g transform="translate(6,6) scale(1)">
        <path d={ICON_SQUARE} fill="currentColor" />
        <path d={ICON_ARROW} fill="currentColor" />
      </g>
      <text
        x="338"
        y="82"
        fontSize="94"
        fontWeight="700"
        textAnchor="middle"
        letterSpacing="2"
        fontFamily="'Space Grotesk', 'Segoe UI', sans-serif"
      >
        SHORTEE
      </text>
    </svg>
  )
}
