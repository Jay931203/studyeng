'use client'

import { AnimatePresence, motion } from 'framer-motion'

const PARTICLES = [
  { x: -92, y: -54, color: '#f472b6' },
  { x: -64, y: -88, color: '#f59e0b' },
  { x: -22, y: -104, color: '#fde047' },
  { x: 18, y: -98, color: '#a3e635' },
  { x: 62, y: -82, color: '#2dd4bf' },
  { x: 92, y: -46, color: '#38bdf8' },
  { x: 100, y: -2, color: '#818cf8' },
  { x: 74, y: 42, color: '#c084fc' },
  { x: 28, y: 66, color: '#fb7185' },
  { x: -22, y: 72, color: '#f97316' },
  { x: -68, y: 48, color: '#facc15' },
  { x: -96, y: 8, color: '#34d399' },
]

export function AnswerBurst({
  burstKey,
  show,
}: {
  burstKey: number
  show: boolean
}) {
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
          {PARTICLES.map((particle, index) => (
            <motion.span
              key={`${burstKey}-${index}`}
              className="absolute h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: particle.color }}
              initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.2, 1, 1, 0.6],
                x: [0, particle.x],
                y: [0, particle.y],
                rotate: [0, (index % 2 === 0 ? 1 : -1) * 180],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.72,
                ease: 'easeOut',
                times: [0, 0.18, 0.68, 1],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
