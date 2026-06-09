'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'

const STEPS = [
  {
    icon: '👋',
    label: 'Welcome',
    title: "Hey! I'm Rize!",
    message: "Your personal Rise coach. I'll walk you through the app so you can start crushing your goals.",
    cta: "Let's go 🔥",
    tab: 'home',
    accent: '#84cc16',
  },
  {
    icon: '🏠',
    label: 'Home',
    title: 'Your Dashboard',
    message: "Your rank, daily calories, streak, and today's workout — everything at a glance the second you open the app.",
    cta: 'Got it',
    tab: 'home',
    accent: '#84cc16',
  },
  {
    icon: '🍎',
    label: 'Nutrition',
    title: 'Track Your Food',
    message: 'Search 200+ foods, scan a barcode, or snap a photo and let AI log it for you. No more guessing macros.',
    cta: 'Nice',
    tab: 'food',
    accent: '#f97316',
  },
  {
    icon: '🏋️',
    label: 'Train',
    title: 'Log Your Lifts',
    message: 'Start a workout, log every set, and watch your PRs push your rank higher. Every rep counts.',
    cta: 'Let\'s lift',
    tab: 'train',
    accent: '#3b82f6',
  },
  {
    icon: '🏆',
    label: 'Ranks',
    title: 'Climb the Ranks',
    message: 'You start at Iron and climb to Elite based on your actual lifts — not streaks, not steps. Real strength.',
    cta: 'I want Elite',
    tab: 'home',
    accent: '#f59e0b',
  },
  {
    icon: '⚡',
    label: 'Coach',
    title: "I'm Always Here",
    message: "Tap the chat icon anytime to talk to me. I know your stats, your goals, and I'm available 24/7.",
    cta: "Let's Rise 🚀",
    tab: 'home',
    accent: '#84cc16',
  },
]

const STORAGE_KEY = 'rise-tutorial-v1-seen'

interface AppTutorialProps {
  onTabChange: (tab: string) => void
}

function RizeFace({ size = 80, accent }: { size?: number; accent: string }) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 80 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="26" y="58" width="28" height="26" rx="10" fill={accent} />
      <rect x="10" y="60" width="16" height="9" rx="4.5" fill={accent} transform="rotate(-20 10 60)" />
      <rect x="54" y="52" width="16" height="9" rx="4.5" fill={accent} transform="rotate(-50 54 52)" />
      <circle cx="40" cy="34" r="22" fill={accent} />
      <ellipse cx="32" cy="26" rx="7" ry="4" fill="white" opacity="0.2" transform="rotate(-25 32 26)" />
      <circle cx="31" cy="33" r="5.5" fill="white" />
      <circle cx="49" cy="33" r="5.5" fill="white" />
      <circle cx="32" cy="34" r="3" fill="#0f172a" />
      <circle cx="50" cy="34" r="3" fill="#0f172a" />
      <circle cx="33.2" cy="32.8" r="1.1" fill="white" />
      <circle cx="51.2" cy="32.8" r="1.1" fill="white" />
      <path d="M30 41 Q40 50 50 41" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="40" r="5" fill="#f97316" opacity="0.3" />
      <circle cx="56" cy="40" r="5" fill="#f97316" opacity="0.3" />
    </svg>
  )
}

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
  const progress = (current + 1) / STEPS.length

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 pt-14 pb-4">
            {/* Progress bar */}
            <div className="flex-1 h-1 bg-border rounded-full mr-4 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: step.accent }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <button
              onClick={dismiss}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-secondary"
            >
              Skip <X className="h-3 w-3" />
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: direction * 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -50 }}
                transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                className="flex flex-col items-center text-center w-full max-w-xs"
              >
                {/* Step label pill */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="mb-6 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
                  style={{ backgroundColor: step.accent + '22', color: step.accent }}
                >
                  {step.label}
                </motion.div>

                {/* Mascot */}
                <motion.div
                  className="relative mb-8"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* Glow ring */}
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-30 scale-110"
                    style={{ backgroundColor: step.accent }}
                  />
                  <RizeFace size={120} accent={step.accent} />

                  {/* Emoji badge */}
                  <motion.div
                    key={`emoji-${current}`}
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 320 }}
                    className="absolute -top-2 -right-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-card border border-border text-xl shadow-lg"
                  >
                    {step.icon}
                  </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-black tracking-tight text-foreground mb-4 leading-tight"
                >
                  {step.title}
                </motion.h1>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="text-base text-muted-foreground leading-relaxed"
                >
                  {step.message}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom actions */}
          <div className="px-6 pb-14 flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={next}
              className="w-full rounded-2xl py-4 text-base font-bold text-black shadow-lg transition-all"
              style={{ backgroundColor: step.accent, boxShadow: `0 8px 24px ${step.accent}44` }}
            >
              {isLast ? "Let's Rise 🚀" : step.cta}
              {!isLast && <ChevronRight className="inline ml-1 h-5 w-5" />}
            </motion.button>

            {!isFirst && (
              <button
                onClick={prev}
                className="text-sm text-muted-foreground py-1 font-medium"
              >
                ← Back
              </button>
            )}

            {/* Step dots */}
            <div className="flex justify-center gap-2 mt-1">
              {STEPS.map((s, i) => (
                <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}>
                  <motion.div
                    animate={{
                      width: i === current ? 20 : 6,
                      opacity: i === current ? 1 : 0.3,
                    }}
                    transition={{ duration: 0.25 }}
                    className="h-1.5 rounded-full"
                    style={{ backgroundColor: i === current ? step.accent : '#888' }}
                  />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
