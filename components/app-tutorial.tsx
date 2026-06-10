'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowDown, ArrowUp, ArrowLeft as ArrowLeftIcon, ArrowRight,
  X, Home, Dumbbell, Utensils, Trophy, LayoutGrid, CheckCircle2,
  Plus, Target, MessageCircle, Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/app-context'

const STORAGE_KEY = 'rise-tutorial-v3-seen'

// ─── Mascot ───────────────────────────────────────────────────────────────────

function RizeFace({ size = 80, accent, expression = 'happy' }: {
  size?: number; accent: string; expression?: 'happy' | 'excited' | 'cool'
}) {
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 80 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="26" y="58" width="28" height="26" rx="10" fill={accent} />
      {/* Arms */}
      <rect x="10" y="60" width="16" height="9" rx="4.5" fill={accent} transform="rotate(-20 10 60)" />
      <rect x="54" y="52" width="16" height="9" rx="4.5" fill={accent} transform="rotate(-50 54 52)" />
      {/* Head */}
      <circle cx="40" cy="34" r="22" fill={accent} />
      {/* Shine */}
      <ellipse cx="32" cy="26" rx="7" ry="4" fill="white" opacity="0.2" transform="rotate(-25 32 26)" />
      {/* Eyes */}
      <circle cx="31" cy="33" r="5.5" fill="white" />
      <circle cx="49" cy="33" r="5.5" fill="white" />
      {expression === 'excited' ? (
        <>
          <circle cx="31" cy="32" r="4" fill="#0f172a" />
          <circle cx="49" cy="32" r="4" fill="#0f172a" />
          <circle cx="32" cy="31" r="1.5" fill="white" />
          <circle cx="50" cy="31" r="1.5" fill="white" />
        </>
      ) : expression === 'cool' ? (
        <>
          <rect x="26" y="30" width="10" height="5" rx="2.5" fill="#0f172a" />
          <rect x="44" y="30" width="10" height="5" rx="2.5" fill="#0f172a" />
        </>
      ) : (
        <>
          <circle cx="32" cy="34" r="3" fill="#0f172a" />
          <circle cx="50" cy="34" r="3" fill="#0f172a" />
          <circle cx="33.2" cy="32.8" r="1.1" fill="white" />
          <circle cx="51.2" cy="32.8" r="1.1" fill="white" />
        </>
      )}
      {/* Mouth */}
      {expression === 'excited'
        ? <ellipse cx="40" cy="43" rx="6" ry="4" fill="white" opacity="0.9" />
        : <path d="M30 41 Q40 50 50 41" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      }
      {/* Cheeks */}
      <circle cx="24" cy="40" r="5" fill="#f97316" opacity="0.3" />
      <circle cx="56" cy="40" r="5" fill="#f97316" opacity="0.3" />
    </svg>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.2 + Math.random() * 1.2,
    color: ['#84cc16','#f97316','#3b82f6','#f59e0b','#ec4899','#a78bfa'][i % 6],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }))

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: p.rotate }}
          animate={{ y: '110vh', opacity: [1, 1, 0], rotate: p.rotate + 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', width: p.size, height: p.size, backgroundColor: p.color, borderRadius: 2 }}
        />
      ))}
    </div>
  )
}

// ─── Arrow with position config ───────────────────────────────────────────────

function FloatingArrow({ direction, color, style }: {
  direction: 'up' | 'down' | 'left' | 'right'
  color: string
  style?: React.CSSProperties
}) {
  const ArrowIcon = direction === 'up' ? ArrowUp
    : direction === 'down' ? ArrowDown
    : direction === 'left' ? ArrowLeftIcon
    : ArrowRight

  const bounce = direction === 'up'   ? { y: [0, -10, 0] }
               : direction === 'down' ? { y: [0, 10, 0] }
               : direction === 'left' ? { x: [0, -10, 0] }
               : { x: [0, 10, 0] }

  return (
    <motion.div
      className="pointer-events-none absolute z-[60] flex flex-col items-center"
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, ...bounce }}
      transition={{ delay: 0.4, duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="relative">
        <div className="absolute inset-0 blur-md rounded-full opacity-60" style={{ backgroundColor: color }} />
        <ArrowIcon style={{ color }} strokeWidth={3} className="relative h-10 w-10 drop-shadow-xl" />
      </div>
    </motion.div>
  )
}

// ─── Step definitions ─────────────────────────────────────────────────────────

type ArrowConfig = {
  direction: 'up' | 'down' | 'left' | 'right'
  style: React.CSSProperties
}

interface TutorialStep {
  tab: string
  color: string
  title: string
  subtitle: string
  description: string
  expression: 'happy' | 'excited' | 'cool'
  arrow: ArrowConfig | null
}

const STEPS: TutorialStep[] = [
  {
    tab: 'home',
    color: '#84cc16',
    title: "Hey! I'm Rize!",
    subtitle: "Your personal coach",
    description: "I'll show you around in 30 seconds so you know exactly where everything is. Tap Next!",
    expression: 'excited',
    arrow: null,
  },
  {
    tab: 'home',
    color: '#84cc16',
    title: 'This is your Home screen',
    subtitle: 'Check this every day',
    description: 'See your calories left for the day, your 7-day streak, and your current rank — all right here.',
    expression: 'happy',
    arrow: { direction: 'up', style: { top: '28%', left: '50%', transform: 'translateX(-50%)' } },
  },
  {
    tab: 'food',
    color: '#f97316',
    title: 'Track your food here',
    subtitle: 'The Food page',
    description: 'Tap the big green "Log Meal" button to add what you eat. Search any food or scan the barcode on the package.',
    expression: 'happy',
    arrow: { direction: 'up', style: { top: '30%', left: '25%' } },
  },
  {
    tab: 'train',
    color: '#3b82f6',
    title: 'Log your workouts here',
    subtitle: 'The Train page',
    description: 'Tap "Start Workout" to begin. Log your sets and reps. Every lift you do pushes your rank up.',
    expression: 'excited',
    arrow: { direction: 'up', style: { top: '30%', left: '50%', transform: 'translateX(-50%)' } },
  },
  {
    tab: 'ranks',
    color: '#f59e0b',
    title: 'This is your Ranks page',
    subtitle: 'Your strength score',
    description: 'Your rank is based on how much you actually lift. You start at Iron — log some PRs and watch it climb.',
    expression: 'cool',
    arrow: { direction: 'up', style: { top: '28%', left: '50%', transform: 'translateX(-50%)' } },
  },
  {
    tab: 'home',
    color: '#84cc16',
    title: 'Your AI Coach is always here',
    subtitle: 'Tap it anytime',
    description: 'See that green Coach button in the bottom right corner? Tap it to ask me anything — workouts, food, motivation. I got you.',
    expression: 'happy',
    arrow: { direction: 'down', style: { bottom: '48%', right: '24px' } },
  },
]

// ─── Post-tutorial hint steps ─────────────────────────────────────────────────

interface HintStep {
  tab: string
  color: string
  mascotText: string
  expression: 'happy' | 'excited' | 'cool'
  arrow: ArrowConfig
  buttonText: string
  buttonAction: 'next' | 'dismiss'
}

const HINTS: HintStep[] = [
  {
    tab: 'food',
    color: '#f97316',
    mascotText: "First things first — tap that Log Meal button and add what you've eaten today!",
    expression: 'excited',
    arrow: { direction: 'up', style: { top: '30%', left: '25%' } },
    buttonText: "I'll log my meal!",
    buttonAction: 'next',
  },
  {
    tab: 'ranks',
    color: '#f59e0b',
    mascotText: "Now let's get your rank! Scroll down to enter your best lifts — bench press, squat, deadlift. Even a guess is fine!",
    expression: 'excited',
    arrow: { direction: 'down', style: { top: '42%', left: '50%', transform: 'translateX(-50%)' } },
    buttonText: "Let me enter my lifts!",
    buttonAction: 'dismiss',
  },
]

// ─── PR Mini-entry overlay (shown after hints) ───────────────────────────────

const STARTER_LIFTS = [
  { id: 'bench', label: 'Bench Press', group: 'chest' as const, unit: 'lbs', placeholder: 'e.g. 135' },
  { id: 'squat', label: 'Squat', group: 'legs' as const, unit: 'lbs', placeholder: 'e.g. 185' },
  { id: 'deadlift', label: 'Deadlift', group: 'back' as const, unit: 'lbs', placeholder: 'e.g. 225' },
]

function PREntryOverlay({ onComplete }: { onComplete: () => void }) {
  const { updateBodyPR } = useApp()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleSave = () => {
    let anyFilled = false
    STARTER_LIFTS.forEach(lift => {
      const val = parseFloat(values[lift.id] ?? '')
      if (!isNaN(val) && val > 0) {
        updateBodyPR(lift.group, lift.id, val)
        anyFilled = true
      }
    })
    if (anyFilled) {
      setSaved(true)
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
        onComplete()
      }, 2800)
    } else {
      onComplete()
    }
  }

  return (
    <>
      {showConfetti && <Confetti />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="rounded-t-3xl bg-card border-t border-border px-6 pt-6 pb-12"
        >
          {!saved ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <RizeFace size={48} accent="#f59e0b" expression="excited" />
                <div>
                  <p className="font-black text-lg text-foreground leading-tight">Enter your best lifts!</p>
                  <p className="text-xs text-muted-foreground">This sets your starting rank. Guess if you're not sure!</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {STARTER_LIFTS.map(lift => (
                  <div key={lift.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground mb-1">{lift.label}</p>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder={lift.placeholder}
                        value={values[lift.id] ?? ''}
                        onChange={e => setValues(v => ({ ...v, [lift.id]: e.target.value }))}
                        className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground mt-5">{lift.unit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={onComplete}
                  className="flex-1 rounded-2xl border border-border py-3.5 text-sm font-semibold text-muted-foreground"
                >
                  Skip for now
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className="flex-1 rounded-2xl bg-amber-500 py-3.5 text-sm font-black text-black shadow-lg shadow-amber-500/30"
                >
                  Set my rank!
                </motion.button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
              >
                <RizeFace size={80} accent="#84cc16" expression="excited" />
              </motion.div>
              <div>
                <p className="text-2xl font-black text-foreground">You're ranked!</p>
                <p className="text-sm text-muted-foreground mt-1">Check your Ranks page to see where you landed!</p>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </>
  )
}

// ─── Main Tutorial ────────────────────────────────────────────────────────────

interface AppTutorialProps {
  onTabChange: (tab: string) => void
}

export function AppTutorial({ onTabChange }: AppTutorialProps) {
  const [phase, setPhase] = useState<'tutorial' | 'hints' | 'pr' | 'done'>('done')
  const [current, setCurrent] = useState(0)
  const [hintIndex, setHintIndex] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) setPhase('tutorial')
    } catch {}
  }, [])

  // Navigate to the right tab whenever step changes
  useEffect(() => {
    if (phase === 'tutorial') onTabChange(STEPS[current].tab)
  }, [current, phase, onTabChange])

  useEffect(() => {
    if (phase === 'hints') onTabChange(HINTS[hintIndex].tab)
  }, [hintIndex, phase, onTabChange])

  const finishAll = () => {
    try { localStorage.setItem(STORAGE_KEY, 'seen') } catch {}
    setPhase('done')
    onTabChange('home')
  }

  const nextStep = () => {
    if (current < STEPS.length - 1) {
      setDirection(1)
      setCurrent(c => c + 1)
    } else {
      // Tutorial done → go to hints
      setPhase('hints')
      setHintIndex(0)
    }
  }

  const prevStep = () => {
    if (current > 0) { setDirection(-1); setCurrent(c => c - 1) }
  }

  const nextHint = () => {
    if (hintIndex < HINTS.length - 1) {
      setHintIndex(i => i + 1)
    } else {
      setPhase('pr')
    }
  }

  // ── PR phase
  if (phase === 'pr') {
    return (
      <AnimatePresence>
        <PREntryOverlay onComplete={finishAll} />
      </AnimatePresence>
    )
  }

  // ── Hint phase
  if (phase === 'hints') {
    const hint = HINTS[hintIndex]
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-black/95 via-black/75 to-transparent pointer-events-auto" />

          <FloatingArrow direction={hint.arrow.direction} color={hint.color} style={hint.arrow.style} />

          <div className="absolute bottom-0 left-0 right-0 pointer-events-auto px-5 pb-12 pt-4">
            <motion.div
              key={hintIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 mb-5"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <RizeFace size={56} accent={hint.color} expression={hint.expression} />
              </motion.div>
              <div className="flex-1 rounded-2xl rounded-tl-none bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-3">
                <p className="text-sm font-semibold text-white leading-relaxed">{hint.mascotText}</p>
              </div>
            </motion.div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={nextHint}
              className="w-full rounded-2xl py-4 text-base font-black text-black shadow-xl"
              style={{ backgroundColor: hint.color, boxShadow: `0 8px 30px ${hint.color}55` }}
            >
              {hint.buttonText}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── Tutorial phase
  if (phase === 'tutorial') {
    const step = STEPS[current]
    const isFirst = current === 0
    const isLast = current === STEPS.length - 1

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none"
        >
          {/* Gradient only on bottom half */}
          <div className="absolute bottom-0 left-0 right-0 h-[52%] bg-gradient-to-t from-black/96 via-black/80 to-transparent pointer-events-auto" />

          {/* Skip button */}
          <div className="absolute top-0 left-0 right-0 flex justify-end px-5 pt-14 pointer-events-auto">
            <button type="button" onClick={finishAll}
              className="flex items-center gap-1.5 rounded-full bg-black/50 px-4 py-2 text-xs font-semibold text-white/70 backdrop-blur-sm border border-white/10">
              Skip <X className="h-3 w-3" />
            </button>
          </div>

          {/* Dynamic arrow — different position per step */}
          {step.arrow && (
            <FloatingArrow
              direction={step.arrow.direction}
              color={step.color}
              style={step.arrow.style}
            />
          )}

          {/* Bottom card */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-auto px-5 pb-12 pt-4">

            {/* Tab pill + step counter */}
            <AnimatePresence mode="wait">
              <motion.div key={`pill-${current}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center justify-between mb-3">
                <div className="rounded-full px-3.5 py-1.5 text-xs font-bold border"
                  style={{ backgroundColor: step.color + '22', color: step.color, borderColor: step.color + '40' }}>
                  {step.subtitle}
                </div>
                <span className="text-xs text-white/40 font-medium">{current + 1} / {STEPS.length}</span>
              </motion.div>
            </AnimatePresence>

            {/* Progress */}
            <div className="flex gap-1.5 mb-4">
              {STEPS.map((s, i) => (
                <motion.div key={i}
                  animate={{ width: i === current ? 24 : 6, opacity: i <= current ? 1 : 0.25 }}
                  transition={{ duration: 0.25 }}
                  className="h-1.5 rounded-full"
                  style={{ backgroundColor: i === current ? step.color : '#fff' }}
                />
              ))}
            </div>

            {/* Mascot + text */}
            <AnimatePresence mode="wait">
              <motion.div key={current}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                className="flex items-end gap-4 mb-5"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="shrink-0"
                >
                  <RizeFace size={64} accent={step.color} expression={step.expression} />
                </motion.div>
                <div className="flex-1 pb-1">
                  <h2 className="text-xl font-black text-white leading-tight mb-1">{step.title}</h2>
                  <p className="text-sm text-white/70 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex gap-3">
              {!isFirst && (
                <button type="button" onClick={prevStep}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white">
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
              )}
              <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={nextStep}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-black"
                style={{ backgroundColor: step.color, boxShadow: `0 8px 30px ${step.color}55` }}>
                {isLast
                  ? <><CheckCircle2 className="h-5 w-5" /> Done! Show me what to do</>
                  : <><ArrowRight className="h-5 w-5" /> Next</>
                }
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return null
}
