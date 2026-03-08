interface LogoProps {
  className?: string
}

export function Logo({ className = 'h-5' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 480 100"
      fill="currentColor"
      className={className}
    >
      <text
        x="240"
        y="78"
        fontSize="96"
        fontWeight="400"
        textAnchor="middle"
        letterSpacing="4"
        fontFamily="'Anton', 'Impact', 'Arial Black', sans-serif"
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
      viewBox="0 0 580 100"
      className={className}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 26 L8 82 Q8 92 18 92 L72 92 Q82 92 82 82 L82 48" />
        <path d="M40 60 L76 14" />
        <path d="M56 14 L76 14 L76 34" />
      </g>
      <text
        x="108"
        y="84"
        fontSize="96"
        fontWeight="400"
        fill="currentColor"
        letterSpacing="4"
        fontFamily="'Anton', 'Impact', 'Arial Black', sans-serif"
      >
        SHORTEE
      </text>
    </svg>
  )
}
