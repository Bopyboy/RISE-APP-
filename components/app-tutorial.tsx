'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'

// ─── RizeFace mascot ──────────────────────────────────────────────────────────

function RizeFace({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 80 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="26" y="58" width="28" height="26" rx="10" fill="currentColor" className="text-primary" />
      <rect x="10" y="60" width="16" height="9" rx="4.5" fill="currentColor" className="text-primary" transform="rotate(-20 10 60)" />
      <rect x="54" y="52" width="16" height="9" rx="4.5" fill="currentColor" className="text-primary" transform="rotate(-50 54 52)" />
      <circle cx="40" cy="34" r="22" fill="currentColor" className="text-primary" />
      <ellipse cx="32" cy="26" rx="7" ry="4" fill="white" opacity="0.12" transform="rotate(-25 32 26)" />
      <circle cx="31" cy="33" r="5.5" fill="white" />
      <circle cx="49" cy="33" r="5.5" fill="white" />
      <circle cx="32" cy="34" r="3" fill="#0f172a" />
      <circle cx="50" cy="34" r="3" fill="#0f172a" />
      <circle cx="33.2" cy="32.8" r="1.1" fill="white" />
      <circle cx="51.2" cy="32.8" r="1.1" fill="white" />
      <path d="M30 41 Q40 50 50 41" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="40" r="5" fill="#f97316" opacity="0.25" />
      <circle cx="56" cy="40" r="5" fill="#f97316" opacity="0.25" />
      <rect x="18" y="17" width="44" height="9" rx="4.5" fill="white" opacity="0.15" />
      <rect x="34" y="13" width="12" height="7" rx="3.5" fill="white" opacity="0.2" />
    </svg>
  )
}

// ─── Steps — each has an optional `tab` that switches the page behind ─────────

const STEPS: { emoji: string; title: string; message: string; tab: string | null }[] = [
  {
    emoji: '👋',
    title: "Hey! I'm Rize!",
    message: "I'm your personal Rise coach! I'll walk you through the whole app so you can start crushing your goals. Ready? Let's go! 🔥",
    tab: 'home',
  },
  {
    emoji: '🏠',
    title: 'Your Home Screen',
    message: "This is your dashboard! Your rank, daily calories, streak, and today's workout are all right here at a glance. 👀",
    tab: 'home',
  },
  {
    emoji: '🍎',
    title: 'Track Your Nutrition',
    message: "Here's where you log your food! Search 200+ foods, scan a barcode, or snap a photo and let AI do the work. 📸",
    tab: 'food',
  },
  {
    emoji: '🏋️',
    title: 'Train & Log PRs',
    message: "This is your Train page! Start a workout, log every set, and watch your PRs push your rank up. Lift heavy! 💪",
    tab: 'train',
  },
  {
    emoji: '🏆',
    title: 'Your Rise Rank',
    message: "Back home — see that rank card? You climb from Iron all the way to Elite based on your real lifts. Go get that Gold! 🥇",
    tab: 'home',
  },
  {
    emoji: '⚡',
    title: "I'm Always Here!",
    message: "Tap the chat icon anytime to talk to me. I know your stats, your goals, and I'm ready 24/7. Now let's Rise! 🚀",
    tab: 'home',
  },
]

const STORAGE_KEY = 'rise-tutorial-v1-seen'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppTutorialProps {
  onTabChange: (tab: string) => void
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AppTutorial({ onTabChange }: AppTutorialProps) {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) setVisible(true)
    } catch {}
  }, [])

  // Switch the tab behind the overlay whenever the step changes
  useEffect(() => {
    if (!visible) return
    const tab = STEPS[current].tab
    if (tab) onTabChange(tab)
  }, [current, visible, onTabChange])

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, 'seen') } catch {}
    setVisible(false)
    onTabChange('home')
  }

  const next = () => {
    if (current < STEPS.length - 1) {
      setDirection(1)
      setCurrent(c => c + 1)
    } else {
      dismiss()
    }
  }

  const prev = () => {
    if (current > 0) {
      setDirection(-1)
      setCurrent(c => c - 1)
    }
  }

  const step = STEPS[current]
  const isLast = current === STEPS.length - 1
  const isFirst = current === 0

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm px-6"
        >
          {/* Skip button */}
          <button
            onClick={dismiss}
            className="absolute right-5 top-12 flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground"
          >
            Skip <X className="h-3 w-3" />
          </button>

          {/* Progress dots */}
          <div className="absolute top-14 left-0 right-0 flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === current ? 24 : 8,
                  opacity: i === current ? 1 : i < current ? 0.6 : 0.25,
                }}
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
              className="flex flex-col items-center text-center max-w-xs w-full"
            >
              {/* Mascot */}
              <div className="relative mb-6">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <RizeFace size={110} />
                </motion.div>

                {/* Emoji bubble */}
                <motion.div
                  key={`emoji-${current}`}
                  initial={{ scale: 0, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                  className="absolute -top-3 -right-5 flex h-12 w-12 items-center justify-center rounded-full bg-card border-2 border-border text-2xl shadow-xl"
                >
                  {step.emoji}
                </motion.div>

                {/* Sparkles */}
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-yellow-400 text-sm font-bold select-none pointer-events-none"
                    style={{ top: `${[-10, 10, -5][i]}%`, left: `${[-25, 85, 50][i]}%` }}
                    animate={{ y: [0, -12, 0], opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
                  >
                    ✦
                  </motion.div>
                ))}
              </div>

              {/* Step label */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xs font-bold uppercase tracking-widest text-primary mb-2"
              >
                Step {current + 1} of {STEPS.length}
              </motion.p>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-2xl font-black tracking-tight text-foreground leading-tight mb-3"
              >
                {step.title}
              </motion.h2>

              {/* Speech bubble */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="relative rounded-3xl bg-card border border-border px-5 py-4 shadow-sm"
              >
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-3 overflow-hidden">
                  <div className="w-3 h-3 bg-card border-l border-t border-border rotate-45 mx-auto translate-y-1" />
                </div>
                <p className="text-base text-foreground leading-relaxed">{step.message}</p>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Buttons */}
          <div className="absolute bottom-14 left-6 right-6 flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              onClick={next}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25"
            >
              {isLast ? <span>Let's Rise! 🚀</span> : <> Got it! <ChevronRight className="h-5 w-5" /> </>}
            </motion.button>

            {!isFirst && (
              <button onClick={prev} className="text-sm text-muted-foreground py-1">
                ← Back
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}