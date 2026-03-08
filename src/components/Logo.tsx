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
