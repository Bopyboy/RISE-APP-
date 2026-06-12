'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft as ArrowLeftIcon, X, CheckCircle2, Star } from 'lucide-react'
import { useApp } from '@/lib/app-context'

const STORAGE_KEY = 'rise-tutorial-v5-seen'

// ─── Mascot ───────────────────────────────────────────────────────────────────

type Expression = 'happy' | 'excited' | 'cool' | 'point_up' | 'point_down' | 'point_right'

function RizeFace({ size = 100, accent, expression = 'happy' }: {
  size?: number
  accent: string
  expression?: Expression
}) {
  const isPointing = expression.startsWith('point')
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="40" cy="93" rx="18" ry="3" fill="black" opacity="0.15" />

      {/* Body */}
      <rect x="25" y="60" width="30" height="28" rx="11" fill={accent} />

      {/* Left arm — always relaxed */}
      <rect x="8" y="64" width="17" height="9" rx="4.5" fill={accent} transform="rotate(-15 8 64)" />

      {/* Right arm — changes based on expression */}
      {expression === 'point_up' && (
        <rect x="54" y="36" width="20" height="9" rx="4.5" fill={accent} transform="rotate(-65 54 36)" />
      )}
      {expression === 'point_down' && (
        <rect x="54" y="70" width="20" height="9" rx="4.5" fill={accent} transform="rotate(30 54 70)" />
      )}
      {expression === 'point_right' && (
        <rect x="56" y="56" width="20" height="9" rx="4.5" fill={accent} transform="rotate(-20 56 56)" />
      )}
      {!isPointing && (
        <rect x="54" y="56" width="17" height="9" rx="4.5" fill={accent} transform="rotate(-50 54 56)" />
      )}

      {/* Finger tip dot */}
      {expression === 'point_up' && (
        <circle cx="63" cy="26" r="4" fill={accent} />
      )}
      {expression === 'point_down' && (
        <circle cx="68" cy="82" r="4" fill={accent} />
      )}
      {expression === 'point_right' && (
        <circle cx="76" cy="52" r="4" fill={accent} />
      )}

      {/* Head */}
      <circle cx="40" cy="35" r="23" fill={accent} />

      {/* Head shine */}
      <ellipse cx="31" cy="26" rx="8" ry="4.5" fill="white" opacity="0.18" transform="rotate(-25 31 26)" />

      {/* Eyes */}
      <circle cx="31" cy="34" r="6" fill="white" />
      <circle cx="49" cy="34" r="6" fill="white" />

      {expression === 'excited' || isPointing ? (
        <>
          <circle cx="31" cy="33" r="4.2" fill="#0f172a" />
          <circle cx="49" cy="33" r="4.2" fill="#0f172a" />
          <circle cx="32.2" cy="31.5" r="1.6" fill="white" />
          <circle cx="50.2" cy="31.5" r="1.6" fill="white" />
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
      {expression === 'excited' ? (
        <ellipse cx="40" cy="44" rx="7" ry="5" fill="white" opacity="0.9" />
      ) : isPointing ? (
        <ellipse cx="40" cy="44" rx="6" ry="4" fill="white" opacity="0.85" />
      ) : (
        <path d="M29 43 Q40 53 51 43" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      )}

      {/* Cheeks */}
      <circle cx="22" cy="41" r="5.5" fill="#f97316" opacity="0.28" />
      <circle cx="58" cy="41" r="5.5" fill="#f97316" opacity="0.28" />

      {/* Eyebrows */}
      {expression === 'cool' && (
        <>
          <path d="M25 27 Q31 24 37 27" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M43 27 Q49 24 55 27" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  )
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.0,
    duration: 1.5 + Math.random() * 1.5,
    color: ['#84cc16','#f97316','#3b82f6','#f59e0b','#ec4899','#a78bfa','#06b6d4'][i % 7],
    size: 5 + Math.random() * 10,
    rotate: Math.random() * 360,
    shape: i % 3 === 0 ? 50 : i % 3 === 1 ? 2 : 8,
  }))
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ y: -30, x: `${p.x}vw`, opacity: 1, rotate: p.rotate }}
          animate={{ y: '110vh', opacity: [1, 1, 0.4, 0], rotate: p.rotate + 540 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ position: 'absolute', width: p.size, height: p.size, backgroundColor: p.color, borderRadius: p.shape }}
        />
      ))}
    </div>
  )
}

// ─── Speech bubble ────────────────────────────────────────────────────────────

function SpeechBubble({ text, color, tailSide = 'bottom' }: {
  text: string; color: string; tailSide?: 'bottom' | 'top' | 'left' | 'right'
}) {
  const tailStyles: Record<string, string> = {
    bottom: `absolute left-1/2 -translate-x-1/2 -bottom-3 border-l-8 border-r-8 border-t-[14px] border-l-transparent border-r-transparent`,
    top:    `absolute left-1/2 -translate-x-1/2 -top-3 border-l-8 border-r-8 border-b-[14px] border-l-transparent border-r-transparent`,
    left:   `absolute top-1/2 -translate-y-1/2 -left-3 border-t-8 border-b-8 border-r-[14px] border-t-transparent border-b-transparent`,
    right:  `absolute top-1/2 -translate-y-1/2 -right-3 border-t-8 border-b-8 border-l-[14px] border-t-transparent border-b-transparent`,
  }
  const tailColorStyle: Record<string, React.CSSProperties> = {
    bottom: { borderTopColor: color },
    top:    { borderBottomColor: color },
    left:   { borderRightColor: color },
    right:  { borderLeftColor: color },
  }
  return (
    <div className="relative max-w-[220px]">
      <div className="rounded-2xl px-4 py-3 shadow-2xl"
        style={{ backgroundColor: color }}>
        <p className="text-sm font-bold leading-snug text-black">{text}</p>
      </div>
      <div className={tailStyles[tailSide]} style={tailColorStyle[tailSide]} />
    </div>
  )
}

// ─── Step definitions ─────────────────────────────────────────────────────────
// Mascot x/y are percentages of viewport width/height.
// Spotlight is a real element box in % of viewport.
// bubbleSide: which side of the mascot the speech bubble tail comes from.

interface Step {
  tab: string
  color: string
  title: string
  body: string
  expression: Expression
  // Mascot center position (% of vw/vh)
  mascot: { x: number; y: number }
  // Speech bubble tail direction relative to mascot
  bubble: 'bottom' | 'top' | 'left' | 'right'
  // Spotlight box in % of viewport (null = no spotlight)
  spot: { t: number; l: number; w: number; h: number; r: number } | null
}

// Layout reference (iPhone-sized ~390×844, but % based so works everywhere):
// Page padding: mx-auto max-w-md px-4 pt-6
// Bottom nav: fixed, bottom 0, height ~86px (h-16 + pb-6)  ≈ 10% of 844
// Home page sections (approx):
//   Header row:        top ~7%,  height ~9%
//   Streak calendar:   top ~17%, height ~7%
//   Calorie card:      top ~25%, height ~19%
//   Quick actions:     top ~45%, height ~10%
//   Rank card:         top ~56%, height ~16%
//   Bottom nav:        top ~89%, height ~10%
// The mascot+bubble live ABOVE the bottom text panel (bottom 52% gradient)
// We place mascot so it visually "walks" to what it's pointing at

const STEPS: Step[] = [
  // 0 ─ Welcome
  {
    tab: 'home', color: '#84cc16',
    title: "Hey! I'm Rize!",
    body: "I'm your personal coach! Let me show you around the app real quick — it only takes about 30 seconds!",
    expression: 'excited',
    mascot: { x: 50, y: 36 },
    bubble: 'bottom',
    spot: null,
  },
  // 1 ─ Home: header (name + streak)
  {
    tab: 'home', color: '#84cc16',
    title: 'Your name and streak',
    body: 'See your name here, today\'s date, and your streak — how many days in a row you\'ve opened the app!',
    expression: 'point_down',
    mascot: { x: 50, y: 20 },
    bubble: 'bottom',
    spot: { t: 6, l: 3, w: 94, h: 10, r: 14 },
  },
  // 2 ─ Home: calorie card
  {
    tab: 'home', color: '#84cc16',
    title: 'Your calories for today',
    body: 'This big number is how many calories you can still eat today. It goes down as you log your meals.',
    expression: 'point_down',
    mascot: { x: 50, y: 22 },
    bubble: 'bottom',
    spot: { t: 24, l: 3, w: 94, h: 20, r: 18 },
  },
  // 3 ─ Home: quick action buttons
  {
    tab: 'home', color: '#84cc16',
    title: 'These two buttons are your shortcuts',
    body: 'The green "Log meal" button adds food. The other one takes you to today\'s workout. You\'ll use these every single day!',
    expression: 'point_down',
    mascot: { x: 50, y: 38 },
    bubble: 'bottom',
    spot: { t: 44, l: 3, w: 94, h: 11, r: 18 },
  },
  // 4 ─ Home: rank card
  {
    tab: 'home', color: '#f59e0b',
    title: 'Your rank badge',
    body: 'You start at IRON rank. As you log workouts and get stronger, your rank goes all the way up to ELITE!',
    expression: 'point_down',
    mascot: { x: 50, y: 50 },
    bubble: 'bottom',
    spot: { t: 55, l: 3, w: 94, h: 17, r: 18 },
  },
  // 5 ─ Bottom nav overview
  {
    tab: 'home', color: '#ffffff',
    title: 'The 5 buttons at the bottom',
    body: 'These take you everywhere in the app. Train, Food, Home, Ranks, and More. I\'ll show you each one now!',
    expression: 'point_down',
    mascot: { x: 50, y: 74 },
    bubble: 'top',
    spot: { t: 88, l: 2, w: 96, h: 11, r: 20 },
  },
  // 6 ─ Food tab highlight on nav
  {
    tab: 'food', color: '#f97316',
    title: 'FOOD — tap here to log meals',
    body: 'This is the Food page. Every time you eat something, come here and tap the "+ Add" button next to that meal.',
    expression: 'point_down',
    mascot: { x: 29, y: 74 },
    bubble: 'top',
    spot: { t: 88, l: 20, w: 20, h: 11, r: 20 },
  },
  // 7 ─ Food: add button on a meal card
  {
    tab: 'food', color: '#f97316',
    title: 'Tap "+ Add" to add food',
    body: 'Each meal section — Breakfast, Lunch, Dinner — has an "+ Add" button. Tap it to search for any food or scan the barcode on the packaging!',
    expression: 'point_right',
    mascot: { x: 12, y: 50 },
    bubble: 'right',
    spot: { t: 48, l: 62, w: 34, h: 7, r: 12 },
  },
  // 8 ─ Train tab
  {
    tab: 'train', color: '#3b82f6',
    title: 'TRAIN — log your workouts',
    body: 'This is the Train page. When you go to the gym, come here first!',
    expression: 'point_down',
    mascot: { x: 12, y: 74 },
    bubble: 'top',
    spot: { t: 88, l: 2, w: 20, h: 11, r: 20 },
  },
  // 9 ─ Train: start button
  {
    tab: 'train', color: '#3b82f6',
    title: 'Tap START to begin a workout',
    body: 'Find today\'s workout on this page and tap the "Start" button. The app guides you through every set and rep!',
    expression: 'point_right',
    mascot: { x: 12, y: 40 },
    bubble: 'right',
    spot: { t: 30, l: 55, w: 42, h: 8, r: 12 },
  },
  // 10 ─ Ranks tab
  {
    tab: 'ranks', color: '#f59e0b',
    title: 'RANKS — see your strength score',
    body: 'Check this page to see your rank, track your lifts, and compare yourself to others!',
    expression: 'point_down',
    mascot: { x: 71, y: 74 },
    bubble: 'top',
    spot: { t: 88, l: 62, w: 20, h: 11, r: 20 },
  },
  // 11 ─ More tab
  {
    tab: 'more', color: '#a78bfa',
    title: 'MORE — goals, settings & coach',
    body: 'Tap More for your Goals, settings, friends, and your AI coach chat. Everything extra lives here!',
    expression: 'point_down',
    mascot: { x: 88, y: 74 },
    bubble: 'top',
    spot: { t: 88, l: 80, w: 18, h: 11, r: 20 },
  },
  // 12 ─ Coach FAB
  {
    tab: 'home', color: '#84cc16',
    title: 'Your AI Coach is always here',
    body: 'See that green Coach button? Tap it ANY time to ask me anything — what to eat, how to train, motivation. I\'m always here for you!',
    expression: 'point_right',
    mascot: { x: 40, y: 82 },
    bubble: 'top',
    spot: { t: 81, l: 68, w: 28, h: 7, r: 99 },
  },
]

// ─── PR entry overlay ─────────────────────────────────────────────────────────

const LIFTS = [
  { id: 'bench',    label: 'Bench Press',  group: 'chest' as const, placeholder: 'e.g. 135 lbs' },
  { id: 'squat',    label: 'Squat',        group: 'legs'  as const, placeholder: 'e.g. 185 lbs' },
  { id: 'deadlift', label: 'Deadlift',     group: 'back'  as const, placeholder: 'e.g. 225 lbs' },
]

function PREntryOverlay({ onComplete }: { onComplete: () => void }) {
  const { updateBodyPR } = useApp()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [confetti, setConfetti] = useState(false)

  const handleSave = () => {
    let any = false
    LIFTS.forEach(lift => {
      const v = parseFloat(values[lift.id] ?? '')
      if (!isNaN(v) && v > 0) { updateBodyPR(lift.group, lift.id, v); any = true }
    })
    if (any) {
      setSaved(true); setConfetti(true)
      setTimeout(() => { setConfetti(false); onComplete() }, 3200)
    } else {
      onComplete()
    }
  }

  return (
    <>
      {confetti && <Confetti />}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="rounded-t-3xl border-t border-border bg-card px-6 pt-7 pb-16"
        >
          {!saved ? (
            <>
              <div className="flex items-center gap-4 mb-2">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
                  <RizeFace size={64} accent="#f59e0b" expression="excited" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-xl font-black text-foreground leading-tight">One last step!</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Enter your best lifts to get your starting rank. Just guess if you're not sure — you can always update it later!</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {LIFTS.map(lift => (
                  <div key={lift.id}>
                    <p className="text-sm font-bold text-foreground mb-2">{lift.label}</p>
                    <input
                      type="number" inputMode="numeric"
                      placeholder={lift.placeholder}
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
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-5 py-8 text-center">
              <motion.div
                animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8 }}>
                <RizeFace size={100} accent="#84cc16" expression="excited" />
              </motion.div>
              <div>
                <p className="text-3xl font-black text-foreground">You're ranked!</p>
                <p className="text-base text-muted-foreground mt-1">Check the Ranks page to see where you landed!</p>
              </div>
              <div className="flex gap-2 mt-1">
                {[...Array(5)].map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16, scale: 0.5 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring', bounce: 0.5 }}>
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

  useEffect(() => {
    try { if (!localStorage.getItem(STORAGE_KEY)) setPhase('tutorial') } catch {}
  }, [])

  useEffect(() => {
    if (phase === 'tutorial') onTabChange(STEPS[current].tab)
  }, [current, phase, onTabChange])

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, 'seen') } catch {}
    setPhase('done'); onTabChange('home')
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

  // Convert % positions to vw/vh CSS
  const mascotLeft = `${step.mascot.x}vw`
  const mascotTop  = `${step.mascot.y}vh`

  return (
    <AnimatePresence>
      <motion.div
        key="tut"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-hidden"
        style={{ pointerEvents: 'none' }}
      >
        {/* Bottom panel dark gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-[48%] bg-gradient-to-t from-black/97 via-black/88 to-transparent" style={{ pointerEvents: 'auto' }} />

        {/* Top fade for skip button readability */}
        <div className="absolute top-0 left-0 right-0 h-[18%] bg-gradient-to-b from-black/55 to-transparent" />

        {/* Skip */}
        <div className="absolute top-0 left-0 right-0 flex justify-end px-5 pt-14" style={{ pointerEvents: 'auto' }}>
          <button type="button" onClick={finish}
            className="flex items-center gap-1.5 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white/70 border border-white/10 backdrop-blur-sm">
            Skip tour <X className="h-3 w-3" />
          </button>
        </div>

        {/* Spotlight — glowing ring around the real UI element */}
        <AnimatePresence mode="wait">
          {step.spot && (
            <motion.div
              key={`spot-${current}`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="absolute pointer-events-none"
              style={{
                top:    `${step.spot.t}vh`,
                left:   `${step.spot.l}vw`,
                width:  `${step.spot.w}vw`,
                height: `${step.spot.h}vh`,
                borderRadius: step.spot.r,
                border: `3px solid ${step.color}`,
                boxShadow: `0 0 0 5px ${step.color}28, 0 0 30px 6px ${step.color}50`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Mascot — moves to a unique position every step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`mascot-${current}`}
            className="absolute pointer-events-none z-[65]"
            style={{
              left: mascotLeft,
              top: mascotTop,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0, scale: 0.3, y: 40 }}
            animate={{
              opacity: 1, scale: 1,
              y: [0, -9, 0],
            }}
            exit={{ opacity: 0, scale: 0.4, y: -20 }}
            transition={{
              opacity: { duration: 0.25 },
              scale:   { duration: 0.4, type: 'spring', bounce: 0.5 },
              y:       { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
            }}
          >
            <RizeFace size={96} accent={step.color} expression={step.expression} />
          </motion.div>
        </AnimatePresence>

        {/* Bottom text panel */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-5" style={{ pointerEvents: 'auto' }}>

          {/* Tag row */}
          <AnimatePresence mode="wait">
            <motion.div key={`tag-${current}`}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center justify-between mb-3">
              <div className="rounded-full px-3.5 py-1.5 text-xs font-black border uppercase tracking-wider"
                style={{ backgroundColor: step.color + '25', color: step.color, borderColor: step.color + '50' }}>
                {step.tab} page
              </div>
              <span className="text-xs font-semibold text-white/40">{current + 1} / {STEPS.length}</span>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar dots */}
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

          {/* Text slides in */}
          <AnimatePresence mode="wait">
            <motion.div key={current}
              initial={{ opacity: 0, x: dir * 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -32 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="mb-5">
              <h2 className="text-xl font-black text-white leading-tight mb-2">{step.title}</h2>
              <p className="text-[0.93rem] text-white/78 leading-relaxed">{step.body}</p>
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
