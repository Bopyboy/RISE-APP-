'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft as ArrowLeftIcon, X, CheckCircle2, Star } from 'lucide-react'
import { useApp } from '@/lib/app-context'

const STORAGE_KEY = 'rise-tutorial-v4-seen'

// ─── Mascot SVG ───────────────────────────────────────────────────────────────

function RizeFace({
  size = 80,
  accent,
  expression = 'happy',
}: {
  size?: number
  accent: string
  expression?: 'happy' | 'excited' | 'cool' | 'point'
}) {
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 80 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <rect x="26" y="58" width="28" height="26" rx="10" fill={accent} />

      {/* Pointing arm (right arm raised up-right) */}
      {expression === 'point' ? (
        <rect
          x="54"
          y="38"
          width="18"
          height="9"
          rx="4.5"
          fill={accent}
          transform="rotate(-55 54 38)"
        />
      ) : (
        <rect
          x="54"
          y="52"
          width="16"
          height="9"
          rx="4.5"
          fill={accent}
          transform="rotate(-50 54 52)"
        />
      )}

      {/* Left arm */}
      <rect
        x="10"
        y="60"
        width="16"
        height="9"
        rx="4.5"
        fill={accent}
        transform="rotate(-20 10 60)"
      />

      {/* Head */}
      <circle cx="40" cy="34" r="22" fill={accent} />

      {/* Shine */}
      <ellipse
        cx="32"
        cy="26"
        rx="7"
        ry="4"
        fill="white"
        opacity="0.2"
        transform="rotate(-25 32 26)"
      />

      {/* Eyes */}
      <circle cx="31" cy="33" r="5.5" fill="white" />
      <circle cx="49" cy="33" r="5.5" fill="white" />

      {expression === 'excited' || expression === 'point' ? (
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
      {expression === 'excited' || expression === 'point' ? (
        <ellipse cx="40" cy="43" rx="6" ry="4" fill="white" opacity="0.9" />
      ) : (
        <path
          d="M30 41 Q40 50 50 41"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Cheeks */}
      <circle cx="24" cy="40" r="5" fill="#f97316" opacity="0.3" />
      <circle cx="56" cy="40" r="5" fill="#f97316" opacity="0.3" />
    </svg>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.4 + Math.random() * 1.2,
    color: ['#84cc16', '#f97316', '#3b82f6', '#f59e0b', '#ec4899', '#a78bfa'][i % 6],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
  }))

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: p.rotate }}
          animate={{ y: '110vh', opacity: [1, 1, 0], rotate: p.rotate + 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  )
}

// ─── Spotlight ring around a screen region ────────────────────────────────────
// top/left/width/height as % of viewport

interface SpotlightConfig {
  top: string    // e.g. '10%'
  left: string
  width: string
  height: string
  radius?: string
}

function Spotlight({ config, color }: { config: SpotlightConfig; color: string }) {
  return (
    <motion.div
      key={JSON.stringify(config)}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="pointer-events-none absolute z-[55]"
      style={{
        top: config.top,
        left: config.left,
        width: config.width,
        height: config.height,
        borderRadius: config.radius ?? '16px',
        border: `3px solid ${color}`,
        boxShadow: `0 0 0 4px ${color}30, 0 0 24px 4px ${color}40`,
      }}
    />
  )
}

// ─── Step types ───────────────────────────────────────────────────────────────

type MascotPosition =
  | 'center-bottom'   // default — floating above text panel
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'mid-left'
  | 'mid-right'

interface TutorialStep {
  tab: string
  color: string
  title: string
  description: string
  expression: 'happy' | 'excited' | 'cool' | 'point'
  mascotPos: MascotPosition
  spotlight: SpotlightConfig | null
}

// ─── Step definitions
// Every spotlight is calibrated to real elements on screen.
// The app has: pt-6 top padding, 80px bottom nav.
// Home page layout (approx % of 844px iPhone 14):
//   Header: ~8–16%
//   Streak calendar: ~18–26%
//   Calorie card: ~26–46%
//   Quick actions: ~47–57%
//   Rank card: ~58–72%
// Bottom nav: bottom 12%

const STEPS: TutorialStep[] = [
  // 0 — Welcome
  {
    tab: 'home',
    color: '#84cc16',
    title: "Hey! I'm Rize — your personal coach!",
    description:
      "I'll give you a quick tour of the app so you know exactly where everything is. It only takes 30 seconds!",
    expression: 'excited',
    mascotPos: 'center-bottom',
    spotlight: null,
  },

  // 1 — Home header (streak + name)
  {
    tab: 'home',
    color: '#84cc16',
    title: 'This is your Home screen',
    description:
      "Up here you can see your name, today's date, and your streak — that's how many days in a row you've used the app!",
    expression: 'point',
    mascotPos: 'mid-left',
    spotlight: { top: '8%', left: '4%', width: '92%', height: '10%', radius: '14px' },
  },

  // 2 — Calorie card
  {
    tab: 'home',
    color: '#84cc16',
    title: 'Your calories for today',
    description:
      'This big number shows how many calories you still have left to eat today. Green bar fills up as you log food.',
    expression: 'point',
    mascotPos: 'mid-right',
    spotlight: { top: '26%', left: '4%', width: '92%', height: '20%', radius: '18px' },
  },

  // 3 — Bottom nav overview
  {
    tab: 'home',
    color: '#84cc16',
    title: 'The buttons at the bottom',
    description:
      'These 5 buttons take you to every part of the app. We will visit each one right now so you know what they do.',
    expression: 'happy',
    mascotPos: 'top-center',
    spotlight: { top: '88%', left: '4%', width: '92%', height: '10%', radius: '18px' },
  },

  // 4 — Food page
  {
    tab: 'food',
    color: '#f97316',
    title: 'The FOOD page — log what you eat',
    description:
      'Tap the Food button at the bottom to come here. Then tap "Log Meal" to search for any food, scan a barcode, or take a photo of your plate.',
    expression: 'point',
    mascotPos: 'mid-right',
    spotlight: { top: '88%', left: '4%', width: '37%', height: '10%', radius: '18px' },
  },

  // 5 — Log meal button on food page
  {
    tab: 'food',
    color: '#f97316',
    title: 'Tap this button to add food',
    description:
      'This green button at the top right — tap it to search for anything you just ate. Do this every time you eat something!',
    expression: 'point',
    mascotPos: 'mid-left',
    spotlight: { top: '8%', left: '60%', width: '36%', height: '8%', radius: '14px' },
  },

  // 6 — Train page
  {
    tab: 'train',
    color: '#3b82f6',
    title: 'The TRAIN page — log your workouts',
    description:
      'Tap the Train button at the far left. When you get to the gym, come here and tap "Start Workout" to begin tracking your exercises.',
    expression: 'point',
    mascotPos: 'mid-right',
    spotlight: { top: '88%', left: '4%', width: '20%', height: '10%', radius: '18px' },
  },

  // 7 — Start workout button
  {
    tab: 'train',
    color: '#3b82f6',
    title: 'Start a workout right here',
    description:
      'Tap "Start Workout" and the app will walk you through everything — pick your exercises, log your weight and reps for each set.',
    expression: 'excited',
    mascotPos: 'mid-left',
    spotlight: { top: '8%', left: '4%', width: '92%', height: '18%', radius: '18px' },
  },

  // 8 — Ranks page
  {
    tab: 'ranks',
    color: '#f59e0b',
    title: 'The RANKS page — see your strength level',
    description:
      'Tap Ranks at the bottom right. Your rank starts at Iron and goes all the way up to Elite as you get stronger!',
    expression: 'excited',
    mascotPos: 'mid-right',
    spotlight: { top: '88%', left: '63%', width: '20%', height: '10%', radius: '18px' },
  },

  // 9 — Rank card on ranks page
  {
    tab: 'ranks',
    color: '#f59e0b',
    title: 'Your rank badge lives here',
    description:
      'This shows your current rank and how close you are to the next one. The more you lift, the higher your rank — it updates automatically!',
    expression: 'cool',
    mascotPos: 'mid-left',
    spotlight: { top: '16%', left: '4%', width: '92%', height: '22%', radius: '18px' },
  },

  // 10 — More page
  {
    tab: 'more',
    color: '#a78bfa',
    title: 'The MORE page — everything else',
    description:
      'Tap More at the far right. This is where you find your Goals, settings, friends, and your AI coach chat.',
    expression: 'happy',
    mascotPos: 'mid-left',
    spotlight: { top: '88%', left: '78%', width: '18%', height: '10%', radius: '18px' },
  },

  // 11 — Coach button (back on home)
  {
    tab: 'home',
    color: '#84cc16',
    title: "One more thing — your AI Coach!",
    description:
      "See that green Coach button at the bottom right of the screen? Tap it anytime to ask me anything — what to eat, how to train, or just for motivation. I'm always here!",
    expression: 'excited',
    mascotPos: 'top-center',
    spotlight: { top: '80%', left: '70%', width: '26%', height: '7%', radius: '99px' },
  },
]

// ─── Mascot position map → absolute CSS ──────────────────────────────────────

function mascotStyle(pos: MascotPosition): React.CSSProperties {
  switch (pos) {
    case 'top-left':    return { top: '12%', left: '5%' }
    case 'top-right':   return { top: '12%', right: '5%' }
    case 'top-center':  return { top: '12%', left: '50%', transform: 'translateX(-50%)' }
    case 'mid-left':    return { top: '42%', left: '5%' }
    case 'mid-right':   return { top: '42%', right: '5%' }
    case 'center-bottom':
    default:            return { bottom: '44%', left: '50%', transform: 'translateX(-50%)' }
  }
}

// ─── PR entry ─────────────────────────────────────────────────────────────────

const STARTER_LIFTS = [
  { id: 'bench',    label: 'Bench Press',  group: 'chest' as const, placeholder: 'e.g. 135' },
  { id: 'squat',    label: 'Squat',        group: 'legs'  as const, placeholder: 'e.g. 185' },
  { id: 'deadlift', label: 'Deadlift',     group: 'back'  as const, placeholder: 'e.g. 225' },
]

function PREntryOverlay({ onComplete }: { onComplete: () => void }) {
  const { updateBodyPR } = useApp()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const handleSave = () => {
    let any = false
    STARTER_LIFTS.forEach((lift) => {
      const v = parseFloat(values[lift.id] ?? '')
      if (!isNaN(v) && v > 0) { updateBodyPR(lift.group, lift.id, v); any = true }
    })
    if (any) {
      setSaved(true)
      setShowConfetti(true)
      setTimeout(() => { setShowConfetti(false); onComplete() }, 3000)
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
        className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/75 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="rounded-t-3xl border-t border-border bg-card px-6 pt-6 pb-14"
        >
          {!saved ? (
            <>
              <div className="flex items-center gap-3 mb-1">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                  <RizeFace size={52} accent="#f59e0b" expression="excited" />
                </motion.div>
                <div>
                  <p className="text-lg font-black text-foreground leading-snug">
                    Last step — enter your best lifts!
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This gives you your starting rank. Just guess if you're not sure!
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {STARTER_LIFTS.map((lift) => (
                  <div key={lift.id}>
                    <p className="text-sm font-bold text-foreground mb-1.5">{lift.label} (lbs)</p>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={lift.placeholder}
                      value={values[lift.id] ?? ''}
                      onChange={(e) => setValues((v) => ({ ...v, [lift.id]: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={onComplete}
                  className="flex-1 rounded-2xl border border-border py-4 text-sm font-semibold text-muted-foreground"
                >
                  Skip for now
                </button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className="flex-1 rounded-2xl bg-amber-500 py-4 text-base font-black text-black shadow-lg shadow-amber-500/30"
                >
                  Set my rank!
                </motion.button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-8 text-center"
            >
              <motion.div
                animate={{ rotate: [0, -12, 12, -8, 0], scale: [1, 1.25, 1] }}
                transition={{ duration: 0.7 }}
              >
                <RizeFace size={88} accent="#84cc16" expression="excited" />
              </motion.div>
              <div>
                <p className="text-2xl font-black text-foreground">You're ranked!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check the Ranks page to see where you landed!
                </p>
              </div>
              <div className="flex gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.09 }}
                  >
                    <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
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

// ─── Main component ───────────────────────────────────────────────────────────

interface AppTutorialProps {
  onTabChange: (tab: string) => void
}

export function AppTutorial({ onTabChange }: AppTutorialProps) {
  const [phase, setPhase] = useState<'tutorial' | 'pr' | 'done'>('done')
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setPhase('tutorial')
    } catch {}
  }, [])

  // Switch to the correct tab whenever step changes
  useEffect(() => {
    if (phase === 'tutorial') onTabChange(STEPS[current].tab)
  }, [current, phase, onTabChange])

  const finishAll = () => {
    try { localStorage.setItem(STORAGE_KEY, 'seen') } catch {}
    setPhase('done')
    onTabChange('home')
  }

  const next = () => {
    if (current < STEPS.length - 1) { setDirection(1); setCurrent((c) => c + 1) }
    else setPhase('pr')
  }

  const prev = () => {
    if (current > 0) { setDirection(-1); setCurrent((c) => c - 1) }
  }

  if (phase === 'pr') {
    return (
      <AnimatePresence>
        <PREntryOverlay onComplete={finishAll} />
      </AnimatePresence>
    )
  }

  if (phase !== 'tutorial') return null

  const step = STEPS[current]
  const isFirst = current === 0
  const isLast = current === STEPS.length - 1

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        {/* Dark scrim — bottom 50% only so you can see the app */}
        <div className="absolute bottom-0 left-0 right-0 h-[54%] bg-gradient-to-t from-black/97 via-black/85 to-transparent pointer-events-auto" />

        {/* Faint top scrim so skip button is readable */}
        <div className="absolute top-0 left-0 right-0 h-[22%] bg-gradient-to-b from-black/50 to-transparent" />

        {/* Skip button */}
        <div className="absolute top-0 left-0 right-0 flex justify-end px-5 pt-14 pointer-events-auto">
          <button
            type="button"
            onClick={finishAll}
            className="flex items-center gap-1.5 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white/70 border border-white/10"
          >
            Skip tour <X className="h-3 w-3" />
          </button>
        </div>

        {/* Spotlight ring — highlights the real UI element being talked about */}
        <AnimatePresence mode="wait">
          {step.spotlight && (
            <Spotlight key={`spot-${current}`} config={step.spotlight} color={step.color} />
          )}
        </AnimatePresence>

        {/* Rize mascot — moves to a different position each step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`mascot-${current}`}
            className="absolute pointer-events-none z-[65]"
            style={mascotStyle(step.mascotPos)}
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{
              opacity: { duration: 0.3 },
              scale: { duration: 0.35, type: 'spring', bounce: 0.4 },
              y: { duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
            }}
          >
            <RizeFace size={70} accent={step.color} expression={step.expression} />
          </motion.div>
        </AnimatePresence>

        {/* Bottom card */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-auto px-5 pb-10 pt-4">

          {/* Step tag + counter */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`tag-${current}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between mb-3"
            >
              <div
                className="rounded-full px-3.5 py-1.5 text-xs font-bold border"
                style={{
                  backgroundColor: step.color + '22',
                  color: step.color,
                  borderColor: step.color + '44',
                }}
              >
                {step.tab.charAt(0).toUpperCase() + step.tab.slice(1)} page
              </div>
              <span className="text-xs font-semibold text-white/40">
                {current + 1} / {STEPS.length}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === current ? 22 : 6,
                  opacity: i < current ? 0.5 : i === current ? 1 : 0.2,
                }}
                transition={{ duration: 0.22 }}
                className="h-1.5 rounded-full"
                style={{ backgroundColor: i === current ? step.color : '#ffffff' }}
              />
            ))}
          </div>

          {/* Text content — slides in from direction of travel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: direction * 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -28 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="mb-5"
            >
              <h2 className="text-[1.35rem] font-black text-white leading-tight mb-2">
                {step.title}
              </h2>
              <p className="text-[0.95rem] text-white/75 leading-relaxed">
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
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-black"
              style={{
                backgroundColor: step.color,
                boxShadow: `0 8px 30px ${step.color}55`,
              }}
            >
              {isLast ? (
                <><CheckCircle2 className="h-5 w-5" /> Done — set my rank!</>
              ) : (
                <><ArrowRight className="h-5 w-5" /> Next</>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
