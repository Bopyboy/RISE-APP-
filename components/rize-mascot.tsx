'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

interface Step {
  emoji: string
  title: string
  message: string
  bg: string
}

interface RizeTipProps {
  id: string
  steps: Step[]
}

export function RizeTip({ id, steps }: RizeTipProps) {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    const key = `rize-tip-${id}`
    const seen = localStorage.getItem(key)
    if (!seen) {
      setCurrent(0)
      setVisible(true)
    }
  }, [id])

  const dismiss = () => {
    localStorage.setItem(`rize-tip-${id}`, 'seen')
    setVisible(false)
  }

  const next = () => {
    if (current < steps.length - 1) {
      setDirection(1)
      setCurrent(c => c + 1)
    } else {
      dismiss()
    }
  }

  const step = steps[current]
  const isLast = current === steps.length - 1

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md px-6"
        >
          {/* Progress dots */}
          <div className="absolute top-12 flex gap-2">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === current ? 24 : 8, opacity: i === current ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full bg-primary"
              />
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: direction * 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: direction * -60, scale: 0.95 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="flex flex-col items-center text-center max-w-xs"
            >
              {/* Mascot + emoji bubble */}
              <div className="relative mb-6">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <RizeFace size={100} />
                </motion.div>

                {/* Floating emoji */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                  className="absolute -top-2 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border text-2xl shadow-lg"
                >
                  {step.emoji}
                </motion.div>
              </div>

              {/* Text */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-2xl font-black tracking-tight text-foreground leading-tight mb-3"
              >
                {step.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-base text-muted-foreground leading-relaxed"
              >
                {step.message}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          {/* Buttons */}
          <div className="absolute bottom-16 left-6 right-6 flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={next}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25"
            >
              {isLast ? "Let's go! 🚀" : (
                <>
                  Next <ChevronRight className="h-5 w-5" />
                </>
              )}
            </motion.button>

            {!isLast && (
              <button
                onClick={dismiss}
                className="text-sm text-muted-foreground py-2"
              >
                Skip intro
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Rize SVG Face ────────────────────────────────────────────────────────────

export function RizeFace({ size = 80 }: { size?: number }) {
  const s = size
  return (
    <svg width={s} height={s * 1.15} viewBox="0 0 80 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="26" y="58" width="28" height="26" rx="10" fill="currentColor" className="text-primary" />
      {/* Left arm */}
      <rect x="10" y="60" width="16" height="9" rx="4.5" fill="currentColor" className="text-primary" transform="rotate(-20 10 60)" />
      {/* Right arm - raised/waving */}
      <rect x="54" y="52" width="16" height="9" rx="4.5" fill="currentColor" className="text-primary" transform="rotate(-50 54 52)" />
      {/* Head */}
      <circle cx="40" cy="34" r="22" fill="currentColor" className="text-primary" />
      {/* Head shine */}
      <ellipse cx="32" cy="26" rx="7" ry="4" fill="white" opacity="0.12" transform="rotate(-25 32 26)" />
      {/* Eyes white */}
      <circle cx="31" cy="33" r="5.5" fill="white" />
      <circle cx="49" cy="33" r="5.5" fill="white" />
      {/* Pupils */}
      <circle cx="32" cy="34" r="3" fill="#0f172a" />
      <circle cx="50" cy="34" r="3" fill="#0f172a" />
      {/* Eye shine */}
      <circle cx="33.2" cy="32.8" r="1.1" fill="white" />
      <circle cx="51.2" cy="32.8" r="1.1" fill="white" />
      {/* Smile */}
      <path d="M30 41 Q40 50 50 41" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <circle cx="24" cy="40" r="5" fill="#f97316" opacity="0.25" />
      <circle cx="56" cy="40" r="5" fill="#f97316" opacity="0.25" />
      {/* Headband */}
      <rect x="18" y="17" width="44" height="9" rx="4.5" fill="white" opacity="0.15" />
      {/* Headband knot */}
      <rect x="34" y="13" width="12" height="7" rx="3.5" fill="white" opacity="0.2" />
    </svg>
  )
}