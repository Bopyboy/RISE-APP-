'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, ArrowUp, ArrowLeft as ArrowLeftIcon, ArrowRight, X, Home, Dumbbell, Utensils, Trophy, LayoutGrid, Target, MessageCircle, Flame, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'rise-tutorial-v2-seen'

// Each step navigates to a real tab and points at something specific
const STEPS = [
  {
    tab: 'home',
    color: '#84cc16',
    title: 'Welcome to RISE',
    subtitle: 'Quick 5-step tour',
    description: "We'll show you around in 30 seconds. Tap Next to begin.",
    arrow: null,
    highlight: null,
  },
  {
    tab: 'home',
    color: '#84cc16',
    title: 'This is your Home screen',
    subtitle: 'Your daily summary',
    description: 'At the top you can see your calories left for today, your streak, and your rank. Everything you need at a glance.',
    arrow: 'up', // points up toward the content
    highlight: null,
  },
  {
    tab: 'train',
    color: '#3b82f6',
    title: 'This is the Train page',
    subtitle: 'Log your workouts here',
    description: 'Tap "Start Workout" to begin a session. Log every set and rep. Your rank goes up as you get stronger.',
    arrow: 'up',
    highlight: null,
  },
  {
    tab: 'food',
    color: '#f97316',
    title: 'This is the Food page',
    subtitle: 'Track what you eat',
    description: 'Search for any food, scan a barcode, or take a photo. It automatically logs your calories and macros.',
    arrow: 'up',
    highlight: null,
  },
  {
    tab: 'ranks',
    color: '#f59e0b',
    title: 'This is the Ranks page',
    subtitle: 'See how strong you are',
    description: 'You start at Iron and work your way up to Elite. Your rank is based on how much you actually lift — not steps or streaks.',
    arrow: 'up',
    highlight: null,
  },
  {
    tab: 'home',
    color: '#84cc16',
    title: 'One last thing',
    subtitle: 'Your AI Coach',
    description: 'See the green Coach button at the bottom right? Tap it anytime to ask your AI coach anything — workouts, food, motivation.',
    arrow: 'down', // points down toward the coach button
    highlight: null,
  },
]

// Tab labels for the nav indicator
const TAB_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  home:  { label: 'Home',  icon: Home,      color: '#84cc16' },
  train: { label: 'Train', icon: Dumbbell,  color: '#3b82f6' },
  food:  { label: 'Food',  icon: Utensils,  color: '#f97316' },
  ranks: { label: 'Ranks', icon: Trophy,    color: '#f59e0b' },
  more:  { label: 'More',  icon: LayoutGrid,color: '#a78bfa' },
}

interface AppTutorialProps {
  onTabChange: (tab: string) => void
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
    onTabChange(STEPS[current].tab)
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
  const tabMeta = TAB_LABELS[step.tab]
  const TabIcon = tabMeta?.icon

  return (
    <AnimatePresence>
      {visible && (
        // Semi-transparent overlay — you can SEE the app behind it
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          {/* Dark gradient only at the bottom — keeps top content visible */}
          <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-black/95 via-black/80 to-transparent pointer-events-auto" />

          {/* Top skip button — always visible */}
          <div className="absolute top-0 left-0 right-0 flex justify-end px-5 pt-14 pointer-events-auto">
            <button
              type="button"
              onClick={dismiss}
              className="flex items-center gap-1.5 rounded-full bg-black/50 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur-sm border border-white/10"
            >
              Skip tour <X className="h-3 w-3" />
            </button>
          </div>

          {/* Arrow pointing UP at the page content */}
          {step.arrow === 'up' && (
            <motion.div
              key={`arrow-up-${current}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: [0, -8, 0] }}
              transition={{ delay: 0.3, duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ top: '38%' }}
            >
              <div className="flex flex-col items-center gap-1">
                <ArrowUp className="h-8 w-8 drop-shadow-lg" style={{ color: step.color }} strokeWidth={3} />
                <ArrowUp className="h-6 w-6 opacity-50" style={{ color: step.color }} strokeWidth={3} />
              </div>
            </motion.div>
          )}

          {/* Arrow pointing DOWN toward coach button */}
          {step.arrow === 'down' && (
            <motion.div
              key={`arrow-down-${current}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: [0, 8, 0] }}
              transition={{ delay: 0.3, duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute right-8 pointer-events-none"
              style={{ bottom: '52%' }}
            >
              <div className="flex flex-col items-center gap-1">
                <ArrowDown className="h-6 w-6 opacity-50" style={{ color: step.color }} strokeWidth={3} />
                <ArrowDown className="h-8 w-8 drop-shadow-lg" style={{ color: step.color }} strokeWidth={3} />
              </div>
            </motion.div>
          )}

          {/* Bottom card — the actual tutorial text */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-auto px-5 pb-12 pt-4">

            {/* Which tab you're on */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`tab-${current}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 mb-4"
              >
                <div
                  className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold"
                  style={{ backgroundColor: step.color + '25', color: step.color, border: `1px solid ${step.color}40` }}
                >
                  {TabIcon && <TabIcon className="h-3.5 w-3.5" />}
                  {tabMeta?.label} page
                </div>
                <span className="text-xs text-white/40 font-medium">
                  Step {current + 1} of {STEPS.length}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-5">
              {STEPS.map((s, i) => (
                <motion.div
                  key={i}
                  animate={{ width: i === current ? 24 : 6, opacity: i <= current ? 1 : 0.25 }}
                  transition={{ duration: 0.25 }}
                  className="h-1.5 rounded-full"
                  style={{ backgroundColor: i === current ? step.color : '#ffffff' }}
                />
              ))}
            </div>

            {/* Text content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="mb-6"
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: step.color }}>
                  {step.subtitle}
                </p>
                <h2 className="text-2xl font-black text-white leading-tight mb-3">
                  {step.title}
                </h2>
                <p className="text-base text-white/75 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex gap-3">
              {!isFirst && (
                <button
                  type="button"
                  onClick={prev}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
              )}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={next}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-black shadow-xl"
                style={{ backgroundColor: step.color, boxShadow: `0 8px 30px ${step.color}55` }}
              >
                {isLast ? (
                  <><CheckCircle2 className="h-5 w-5" /> Got it, let's go!</>
                ) : (
                  <><ArrowRight className="h-5 w-5" /> Next</>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
