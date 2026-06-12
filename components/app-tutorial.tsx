'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft as ArrowLeftIcon, X, CheckCircle2, Star } from 'lucide-react'
import { useApp } from '@/lib/app-context'

const STORAGE_KEY = 'rise-tutorial-v6-seen'

// ─── Mascot ───────────────────────────────────────────────────────────────────

type Expression = 'happy' | 'excited' | 'cool' | 'point_up' | 'point_down' | 'point_right' | 'point_left'

function RizeFace({ size = 100, accent, expression = 'happy' }: {
  size?: number; accent: string; expression?: Expression
}) {
  const pointing = expression.startsWith('point')
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="93" rx="18" ry="3" fill="black" opacity="0.15" />
      <rect x="25" y="60" width="30" height="28" rx="11" fill={accent} />
      {/* Left arm relaxed */}
      <rect x="8" y="64" width="17" height="9" rx="4.5" fill={accent} transform="rotate(-15 8 64)" />
      {/* Right arm changes */}
      {expression === 'point_up'    && <rect x="54" y="34" width="21" height="9" rx="4.5" fill={accent} transform="rotate(-68 54 34)" />}
      {expression === 'point_down'  && <rect x="54" y="72" width="21" height="9" rx="4.5" fill={accent} transform="rotate(32 54 72)" />}
      {expression === 'point_right' && <rect x="57" y="57" width="21" height="9" rx="4.5" fill={accent} transform="rotate(-18 57 57)" />}
      {expression === 'point_left'  && <rect x="2"  y="54" width="21" height="9" rx="4.5" fill={accent} transform="rotate(18 2 54)" />}
      {!pointing && <rect x="54" y="56" width="17" height="9" rx="4.5" fill={accent} transform="rotate(-50 54 56)" />}
      {/* Fingertip */}
      {expression === 'point_up'    && <circle cx="62" cy="24" r="5" fill={accent} />}
      {expression === 'point_down'  && <circle cx="69" cy="84" r="5" fill={accent} />}
      {expression === 'point_right' && <circle cx="78" cy="53" r="5" fill={accent} />}
      {expression === 'point_left'  && <circle cx="2"  cy="48" r="5" fill={accent} />}
      {/* Head */}
      <circle cx="40" cy="35" r="23" fill={accent} />
      <ellipse cx="31" cy="26" rx="8" ry="4.5" fill="white" opacity="0.18" transform="rotate(-25 31 26)" />
      {/* Eyes */}
      <circle cx="31" cy="34" r="6" fill="white" />
      <circle cx="49" cy="34" r="6" fill="white" />
      {(expression === 'excited' || pointing) ? (
        <>
          <circle cx="31" cy="33" r="4.2" fill="#0f172a" />
          <circle cx="49" cy="33" r="4.2" fill="#0f172a" />
          <circle cx="32.5" cy="31.5" r="1.6" fill="white" />
          <circle cx="50.5" cy="31.5" r="1.6" fill="white" />
        </>
      ) : expression === 'cool' ? (
        <>
          <rect x="25" y="31" width="12" height="5.5" rx="2.75" fill="#0f172a" />
          <rect x="43" y="31" width="12" height="5.5" rx="2.75" fill="#0f172a" />
        </>
      ) : (
        <>
          <circle cx="32" cy="35" r="3.2" fill="#0f172a" />
          <circle cx="50" cy="35" r="3.2" fill="#0f172a" />
          <circle cx="33.3" cy="33.5" r="1.2" fill="white" />
          <circle cx="51.3" cy="33.5" r="1.2" fill="white" />
        </>
      )}
      {/* Mouth */}
      {(expression === 'excited') ? (
        <ellipse cx="40" cy="44" rx="7" ry="5" fill="white" opacity="0.9" />
      ) : pointing ? (
        <ellipse cx="40" cy="44" rx="6" ry="4" fill="white" opacity="0.85" />
      ) : (
        <path d="M29 43 Q40 53 51 43" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      )}
      {/* Cheeks */}
      <circle cx="22" cy="41" r="5.5" fill="#f97316" opacity="0.28" />
      <circle cx="58" cy="41" r="5.5" fill="#f97316" opacity="0.28" />
      {/* Cool eyebrows */}
      {expression === 'cool' && (
        <>
          <path d="M25 27 Q31 24 37 27" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M43 27 Q49 24 55 27" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti() {
  const pieces = Array.from({ length: 65 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.0,
    duration: 1.5 + Math.random() * 1.5,
    color: ['#84cc16','#f97316','#3b82f6','#f59e0b','#ec4899','#a78bfa','#06b6d4'][i % 7],
    size: 5 + Math.random() * 11,
    rotate: Math.random() * 360,
    radius: [50, 2, 8][i % 3],
  }))
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ y: -30, x: `${p.x}vw`, opacity: 1, rotate: p.rotate }}
          animate={{ y: '110vh', opacity: [1, 1, 0.3, 0], rotate: p.rotate + 540 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', width: p.size, height: p.size, backgroundColor: p.color, borderRadius: p.radius }}
        />
      ))}
    </div>
  )
}

// ─── Step config ──────────────────────────────────────────────────────────────

interface Step {
  tab: string
  color: string
  title: string
  body: string
  expression: Expression
  // Mascot position: % of viewport (center point)
  mascot: { x: number; y: number }
  // Spotlight in % of viewport. null = none
  spot: { t: number; l: number; w: number; h: number; r: number } | null
  // Scroll the window to this px offset BEFORE showing spotlight (0 = scroll to top)
  scrollTo: number
}

// ─── All steps ────────────────────────────────────────────────────────────────
// Measurements based on:
//  - App page: mx-auto max-w-md px-4 pt-6
//  - Bottom nav: fixed, ~88px tall at bottom
//  - Viewport 844px tall (iPhone 14) → 1vh = 8.44px
//  - Home page scroll starts at 0 for all home steps
//  - Food page: calorie card ~250px, then AI banner ~70px, then Breakfast at ~520px from top
//    → scroll to 400 to bring Breakfast Add button into view
//  - Train page: header+tabs+plan card+meal link+form card ≈ 480px → Start button at ~550px
//    → scroll to 380 to bring first Start button into view

const STEPS: Step[] = [
  // 0 — Welcome, no spotlight
  {
    tab: 'home', color: '#84cc16', scrollTo: 0,
    title: "Hey! I'm Rize — your personal coach!",
    body: "I'm going to walk you through the whole app right now so you know exactly what to do. It only takes 30 seconds!",
    expression: 'excited',
    mascot: { x: 50, y: 35 },
    spot: null,
  },
  // 1 — Home: header
  {
    tab: 'home', color: '#84cc16', scrollTo: 0,
    title: 'Your name and daily streak',
    body: 'Up here is your name, today\'s date, and your streak — that\'s how many days in a row you\'ve used RISE!',
    expression: 'point_down',
    mascot: { x: 50, y: 22 },
    spot: { t: 6, l: 3, w: 94, h: 10, r: 14 },
  },
  // 2 — Home: calorie card
  {
    tab: 'home', color: '#84cc16', scrollTo: 0,
    title: 'Your calories for today',
    body: 'This big number is how many calories you can still eat today. It counts down every time you log a meal.',
    expression: 'point_down',
    mascot: { x: 50, y: 21 },
    spot: { t: 24, l: 3, w: 94, h: 20, r: 18 },
  },
  // 3 — Home: Log Meal + Train shortcuts
  {
    tab: 'home', color: '#84cc16', scrollTo: 0,
    title: 'Your two main shortcuts',
    body: 'The GREEN button logs your food. The other button takes you to today\'s workout. You\'ll tap one of these every single day!',
    expression: 'point_down',
    mascot: { x: 50, y: 38 },
    spot: { t: 44, l: 3, w: 94, h: 11, r: 18 },
  },
  // 4 — Home: rank card
  {
    tab: 'home', color: '#f59e0b', scrollTo: 0,
    title: 'Your rank — starts at IRON',
    body: 'Everyone starts at Iron rank. Log your workouts and get stronger, and your rank climbs all the way up to ELITE!',
    expression: 'point_down',
    mascot: { x: 50, y: 49 },
    spot: { t: 55, l: 3, w: 94, h: 17, r: 18 },
  },
  // 5 — Bottom nav overview
  {
    tab: 'home', color: '#ffffff', scrollTo: 0,
    title: 'The 5 buttons at the bottom',
    body: 'These take you everywhere in the app — Train, Food, Home, Ranks, and More. I\'ll take you to each one now!',
    expression: 'point_down',
    mascot: { x: 50, y: 74 },
    spot: { t: 88, l: 2, w: 96, h: 11, r: 20 },
  },
  // 6 — Navigate to Food, scroll to top, show food tab in nav
  {
    tab: 'food', color: '#f97316', scrollTo: 0,
    title: 'FOOD page — this is where you log meals',
    body: 'You\'re now on the Food page. Every time you eat something, come here. Tap the FOOD button at the bottom to get back here anytime!',
    expression: 'point_down',
    mascot: { x: 29, y: 74 },
    spot: { t: 88, l: 20, w: 20, h: 11, r: 20 },
  },
  // 7 — Food: scroll down to show the Breakfast "+ Add" button
  {
    tab: 'food', color: '#f97316', scrollTo: 420,
    title: 'Tap "+ Add" to log what you eat',
    body: 'Each meal has an "+ Add" button right here. Tap it to search for any food by name, or scan the barcode on the package!',
    expression: 'point_right',
    mascot: { x: 12, y: 52 },
    spot: { t: 47, l: 62, w: 34, h: 8, r: 12 },
  },
  // 8 — Navigate to Train, scroll to top, show train tab in nav
  {
    tab: 'train', color: '#3b82f6', scrollTo: 0,
    title: 'TRAIN page — log your workouts',
    body: 'You\'re on the Train page now. When you go to the gym, come here first. Tap TRAIN at the bottom left to get here!',
    expression: 'point_down',
    mascot: { x: 12, y: 74 },
    spot: { t: 88, l: 2, w: 20, h: 11, r: 20 },
  },
  // 9 — Train: scroll down to the workout cards with Start buttons
  {
    tab: 'train', color: '#3b82f6', scrollTo: 400,
    title: 'Find today\'s workout and tap START',
    body: 'Scroll down to see your workout plan. Each day has a START button — tap it and the app walks you through every exercise, set, and rep!',
    expression: 'point_right',
    mascot: { x: 12, y: 44 },
    spot: { t: 38, l: 55, w: 42, h: 9, r: 14 },
  },
  // 10 — Ranks tab
  {
    tab: 'ranks', color: '#f59e0b', scrollTo: 0,
    title: 'RANKS — track your strength score',
    body: 'This page shows your rank, your personal records on every lift, and how close you are to the next rank!',
    expression: 'point_down',
    mascot: { x: 71, y: 74 },
    spot: { t: 88, l: 62, w: 20, h: 11, r: 20 },
  },
  // 11 — More tab
  {
    tab: 'more', color: '#a78bfa', scrollTo: 0,
    title: 'MORE — goals, settings & everything else',
    body: 'Tap More for your Goals tracker, Settings, Friends leaderboard, and your AI coach chat. Everything extra lives here!',
    expression: 'point_down',
    mascot: { x: 88, y: 74 },
    spot: { t: 88, l: 80, w: 18, h: 11, r: 20 },
  },
  // 12 — Back to home, show Coach FAB
  {
    tab: 'home', color: '#84cc16', scrollTo: 0,
    title: 'Your AI Coach button',
    body: 'See that green COACH button at the bottom right? Tap it ANY time to ask me anything — what to eat, how to train, motivation. I\'m always here!',
    expression: 'point_right',
    mascot: { x: 40, y: 83 },
    spot: { t: 81, l: 68, w: 28, h: 7, r: 99 },
  },
]

// ─── PR entry ─────────────────────────────────────────────────────────────────

const LIFTS = [
  { id: 'bench',    label: 'Bench Press (lbs)',  group: 'chest' as const, placeholder: 'e.g. 135' },
  { id: 'squat',    label: 'Squat (lbs)',         group: 'legs'  as const, placeholder: 'e.g. 185' },
  { id: 'deadlift', label: 'Deadlift (lbs)',      group: 'back'  as const, placeholder: 'e.g. 225' },
]

function PREntryOverlay({ onComplete }: { onComplete: () => void }) {
  const { updateBodyPR } = useApp()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [confetti, setConfetti] = useState(false)

  const handleSave = () => {
    let any = false
    LIFTS.forEach(l => {
      const v = parseFloat(values[l.id] ?? '')
      if (!isNaN(v) && v > 0) { updateBodyPR(l.group, l.id, v); any = true }
    })
    if (any) {
      setSaved(true); setConfetti(true)
      setTimeout(() => { setConfetti(false); onComplete() }, 3400)
    } else {
      onComplete()
    }
  }

  return (
    <>
      {confetti && <Confetti />}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/82 backdrop-blur-sm">
        <motion.div
          initial={{ y: 130, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 130 }}
          transition={{ type: 'spring', damping: 24, stiffness: 250 }}
          className="rounded-t-3xl border-t border-border bg-card px-6 pt-7 pb-16">
          {!saved ? (
            <>
              <div className="flex items-center gap-4 mb-3">
                <motion.div animate={{ y: [0, -9, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                  <RizeFace size={72} accent="#f59e0b" expression="excited" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-xl font-black text-foreground leading-tight">Last step — your best lifts!</p>
                  <p className="text-sm text-muted-foreground mt-1">This sets your starting rank. Guess if you're not sure — you can always update it later!</p>
                </div>
              </div>
              <div className="space-y-4 mt-4">
                {LIFTS.map(lift => (
                  <div key={lift.id}>
                    <p className="text-sm font-bold text-foreground mb-2">{lift.label}</p>
                    <input type="number" inputMode="numeric" placeholder={lift.placeholder}
                      value={values[lift.id] ?? ''}
                      onChange={e => setValues(v => ({ ...v, [lift.id]: e.target.value }))}
                      className="w-full rounded-2xl border border-border bg-secondary px-4 py-3.5 text-base font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={onComplete}
                  className="flex-1 rounded-2xl border border-border py-4 text-sm font-semibold text-muted-foreground">
                  Skip for now
                </button>
                <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={handleSave}
                  className="flex-[2] rounded-2xl bg-amber-500 py-4 text-base font-black text-black shadow-xl shadow-amber-500/30">
                  Set my rank!
                </motion.button>
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-5 py-10 text-center">
              <motion.div animate={{ rotate: [0, -14, 14, -9, 9, 0], scale: [1, 1.3, 1] }} transition={{ duration: 0.75 }}>
                <RizeFace size={110} accent="#84cc16" expression="excited" />
              </motion.div>
              <div>
                <p className="text-3xl font-black text-foreground">You're ranked!</p>
                <p className="text-base text-muted-foreground mt-1">Check the Ranks page to see where you landed!</p>
              </div>
              <div className="flex gap-2 mt-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 18, scale: 0.4 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring', bounce: 0.55 }}>
                    <Star className="h-7 w-7 fill-amber-400 text-amber-400" />
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

// ─── Main ─────────────────────────────────────────────────────────────────────

interface AppTutorialProps {
  onTabChange: (tab: string) => void
}

export function AppTutorial({ onTabChange }: AppTutorialProps) {
  const [phase, setPhase] = useState<'tutorial' | 'pr' | 'done'>('done')
  const [current, setCurrent] = useState(0)
  const [dir, setDir] = useState(1)
  const [spotReady, setSpotReady] = useState(false)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try { if (!localStorage.getItem(STORAGE_KEY)) setPhase('tutorial') } catch {}
  }, [])

  // When the step changes: switch tab first, then scroll, then show spotlight
  useEffect(() => {
    if (phase !== 'tutorial') return
    const step = STEPS[current]

    setSpotReady(false)
    onTabChange(step.tab)

    // Give the page a moment to render after tab switch, then scroll
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      window.scrollTo({ top: step.scrollTo, behavior: 'smooth' })
      // Wait for scroll to finish before lighting up the spotlight
      setTimeout(() => setSpotReady(true), step.scrollTo > 0 ? 500 : 80)
    }, 200)

    return () => { if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current) }
  }, [current, phase, onTabChange])

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, 'seen') } catch {}
    window.scrollTo({ top: 0 })
    setPhase('done')
    onTabChange('home')
  }

  const next = () => {
    if (current < STEPS.length - 1) { setDir(1); setCurrent(c => c + 1) }
    else setPhase('pr')
  }
  const prev = () => {
    if (current > 0) { setDir(-1); setCurrent(c => c - 1) }
  }

  if (phase === 'pr') return <AnimatePresence><PREntryOverlay onComplete={finish} /></AnimatePresence>
  if (phase !== 'tutorial') return null

  const step = STEPS[current]
  const isFirst = current === 0
  const isLast = current === STEPS.length - 1

  return (
    <AnimatePresence>
      <motion.div key="tut"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-hidden"
        style={{ pointerEvents: 'none' }}>

        {/* Bottom gradient panel */}
        <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-black/97 via-black/88 to-transparent"
          style={{ pointerEvents: 'auto' }} />

        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-[18%] bg-gradient-to-b from-black/55 to-transparent" />

        {/* Skip */}
        <div className="absolute top-0 left-0 right-0 flex justify-end px-5 pt-14" style={{ pointerEvents: 'auto' }}>
          <button type="button" onClick={finish}
            className="flex items-center gap-1.5 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white/70 border border-white/10">
            Skip tour <X className="h-3 w-3" />
          </button>
        </div>

        {/* Spotlight — only shown after scroll settles */}
        <AnimatePresence mode="wait">
          {step.spot && spotReady && (
            <motion.div
              key={`spot-${current}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="absolute pointer-events-none"
              style={{
                top: `${step.spot.t}vh`,
                left: `${step.spot.l}vw`,
                width: `${step.spot.w}vw`,
                height: `${step.spot.h}vh`,
                borderRadius: step.spot.r,
                border: `3px solid ${step.color}`,
                boxShadow: `0 0 0 5px ${step.color}28, 0 0 32px 6px ${step.color}55`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Mascot — bounces into its unique position each step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`mascot-${current}`}
            className="absolute pointer-events-none z-[65]"
            style={{
              left: `${step.mascot.x}vw`,
              top:  `${step.mascot.y}vh`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0, scale: 0.2, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            exit={{ opacity: 0, scale: 0.3, y: -30 }}
            transition={{
              opacity: { duration: 0.22 },
              scale:   { duration: 0.42, type: 'spring', bounce: 0.55 },
              y:       { duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
            }}
          >
            <RizeFace size={100} accent={step.color} expression={step.expression} />
          </motion.div>
        </AnimatePresence>

        {/* Bottom text panel */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-5" style={{ pointerEvents: 'auto' }}>

          {/* Page tag + counter */}
          <AnimatePresence mode="wait">
            <motion.div key={`tag-${current}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-between mb-3">
              <div className="rounded-full px-3.5 py-1.5 text-xs font-black border uppercase tracking-wider"
                style={{ backgroundColor: step.color + '25', color: step.color, borderColor: step.color + '50' }}>
                {step.tab} page
              </div>
              <span className="text-xs font-semibold text-white/40">{current + 1} / {STEPS.length}</span>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <motion.div key={i}
                animate={{ width: i === current ? 24 : 5, opacity: i < current ? 0.45 : i === current ? 1 : 0.18 }}
                transition={{ duration: 0.2 }}
                className="h-1.5 rounded-full"
                style={{ backgroundColor: i === current ? step.color : '#ffffff' }}
              />
            ))}
          </div>

          {/* Sliding text */}
          <AnimatePresence mode="wait">
            <motion.div key={current}
              initial={{ opacity: 0, x: dir * 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -32 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="mb-5">
              <h2 className="text-xl font-black text-white leading-tight mb-2">{step.title}</h2>
              <p className="text-[0.94rem] leading-relaxed" style={{ color: 'rgba(255,255,255,0.78)' }}>{step.body}</p>
            </motion.div>
          </AnimatePresence>

          {/* Buttons */}
          <div className="flex gap-3">
            {!isFirst && (
              <button type="button" onClick={prev}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white active:scale-95 transition-transform">
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            )}
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={next}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-black"
              style={{ backgroundColor: step.color, boxShadow: `0 8px 32px ${step.color}60` }}>
              {isLast
                ? <><CheckCircle2 className="h-5 w-5" /> Done — set my rank!</>
                : <><ArrowRight className="h-5 w-5" /> Next</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
