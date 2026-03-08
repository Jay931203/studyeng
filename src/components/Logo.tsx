interface LogoProps {
  className?: string
}

export function Logo({ className = 'h-5' }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 520 112"
      fill="currentColor"
      className={className}
    >
      <path
        d="M34 24h104v64H34V24Zm-14-14v92h132V10H20Zm62 2 34 34H92v18h48V16H82Z"
        fill="currentColor"
      />
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
    <img
      src="/logo-full-alt.png"
      alt="Shortee"
      className={`opacity-95 dark:invert ${className}`}
      draggable={false}
    />
  )
}
