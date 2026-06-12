'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft as ArrowLeftIcon, X, CheckCircle2, Star, MousePointerClick } from 'lucide-react'
import { useApp } from '@/lib/app-context'

const STORAGE_KEY = 'rise-tutorial-v7-seen'

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
      <rect x="8" y="64" width="17" height="9" rx="4.5" fill={accent} transform="rotate(-15 8 64)" />
      {expression === 'point_up'    && <rect x="54" y="34" width="21" height="9" rx="4.5" fill={accent} transform="rotate(-68 54 34)" />}
      {expression === 'point_down'  && <rect x="54" y="72" width="21" height="9" rx="4.5" fill={accent} transform="rotate(32 54 72)" />}
      {expression === 'point_right' && <rect x="57" y="57" width="21" height="9" rx="4.5" fill={accent} transform="rotate(-18 57 57)" />}
      {expression === 'point_left'  && <rect x="2"  y="54" width="21" height="9" rx="4.5" fill={accent} transform="rotate(18 2 54)" />}
      {!pointing && <rect x="54" y="56" width="17" height="9" rx="4.5" fill={accent} transform="rotate(-50 54 56)" />}
      {expression === 'point_up'    && <circle cx="62" cy="24" r="5" fill={accent} />}
      {expression === 'point_down'  && <circle cx="69" cy="84" r="5" fill={accent} />}
      {expression === 'point_right' && <circle cx="78" cy="53" r="5" fill={accent} />}
      {expression === 'point_left'  && <circle cx="2"  cy="48" r="5" fill={accent} />}
      <circle cx="40" cy="35" r="23" fill={accent} />
      <ellipse cx="31" cy="26" rx="8" ry="4.5" fill="white" opacity="0.18" transform="rotate(-25 31 26)" />
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
      {(expression === 'excited') ? (
        <ellipse cx="40" cy="44" rx="7" ry="5" fill="white" opacity="0.9" />
      ) : pointing ? (
        <ellipse cx="40" cy="44" rx="6" ry="4" fill="white" opacity="0.85" />
      ) : (
        <path d="M29 43 Q40 53 51 43" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      )}
      <circle cx="22" cy="41" r="5.5" fill="#f97316" opacity="0.28" />
      <circle cx="58" cy="41" r="5.5" fill="#f97316" opacity="0.28" />
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

// ─── DOM targeting helpers ────────────────────────────────────────────────────
// We find live elements in the rendered app by walking the DOM. This way the
// spotlight always lands EXACTLY on the real button, no hardcoded coordinates.

type Finder = () => HTMLElement | null

const findByText = (selector: string, text: string, root: ParentNode = document): HTMLElement | null => {
  const needle = text.toLowerCase().trim()
  const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector))
  return nodes.find(n => (n.textContent || '').toLowerCase().trim() === needle)
      ?? nodes.find(n => (n.textContent || '').toLowerCase().includes(needle))
      ?? null
}

const findNavButton = (label: string): HTMLElement | null => {
  const nav = document.querySelector('nav')
  if (!nav) return null
  return findByText('button', label, nav)
}

// The Breakfast card's "Add" button: find the heading "Breakfast", walk up to
// its card container, then find the Add button inside it.
const findBreakfastAdd: Finder = () => {
  const headings = Array.from(document.querySelectorAll<HTMLElement>('h3'))
  const heading = headings.find(h => (h.textContent || '').trim().toLowerCase() === 'breakfast')
  if (!heading) return null
  const card = heading.closest<HTMLElement>('div.rounded-2xl, [class*="rounded-2xl"]') || heading.parentElement?.parentElement?.parentElement
  if (!card) return null
  return findByText('button', 'Add', card)
}

const findCoachFab: Finder = () => {
  // RizeTip floating button — find a fixed-positioned button outside of <nav>
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('button'))
  return candidates.find(b => {
    if (b.closest('nav')) return false
    const cs = getComputedStyle(b)
    if (cs.position !== 'fixed') return false
    const r = b.getBoundingClientRect()
    return r.bottom > window.innerHeight - 220 && r.right > window.innerWidth - 160 && r.width < 200
  }) || null
}

// ─── Step config ──────────────────────────────────────────────────────────────

interface Step {
  tab: string
  color: string
  title: string
  body: string
  expression: Expression
  // DOM finder for the element to spotlight. null = no spotlight (centered card).
  find: Finder | null
  // If true, the user MUST click the highlighted element to advance.
  requireClick?: boolean
  // Optional: wait for this condition (polled) before advancing automatically.
  waitFor?: () => boolean
  // Where the mascot sits relative to the spotlight: 'above' | 'below' | 'left' | 'right'
  mascotSide?: 'above' | 'below' | 'left' | 'right'
}

const STEPS: Step[] = [
  {
    tab: 'home', color: '#84cc16',
    title: "Hey! I'm Rize — your coach!",
    body: "I'll walk you through the app and help you log your first meal right now. Takes 30 seconds. Tap Next to start!",
    expression: 'excited',
    find: null,
  },
  {
    tab: 'home', color: '#84cc16',
    title: 'This is your Home base',
    body: "Your name, streak and today's calories live here. You'll come back here every day. Now let's go log a meal — tap Next!",
    expression: 'point_down',
    find: null,
  },
  {
    tab: 'home', color: '#f97316',
    title: 'Tap the FOOD button',
    body: "See it highlighted at the bottom? Tap it now to open your meal log.",
    expression: 'point_down',
    find: () => findNavButton('Food'),
    requireClick: true,
    mascotSide: 'above',
  },
  {
    tab: 'food', color: '#f97316',
    title: 'Tap "+ Add" on Breakfast',
    body: "This opens the food picker. Tap it now and pick anything — even a guess works for this tour!",
    expression: 'point_right',
    find: findBreakfastAdd,
    requireClick: true,
    mascotSide: 'left',
  },
  {
    tab: 'food', color: '#f97316',
    title: 'Pick any food to log it!',
    body: "Search a food or choose from a category, then hit Add. I'll wait right here…",
    expression: 'excited',
    find: null,
    // Advance automatically the moment a meal entry exists.
    waitFor: () => true, // handled specially in component via useApp
  },
  {
    tab: 'food', color: '#84cc16',
    title: "Boom — first meal logged! 🎉",
    body: "That's it. Every meal works the same way. Now let me show you the rest real quick.",
    expression: 'excited',
    find: null,
  },
  {
    tab: 'home', color: '#3b82f6',
    title: 'TRAIN is for workouts',
    body: "Tap the TRAIN button at the bottom-left to see how it works.",
    expression: 'point_down',
    find: () => findNavButton('Train'),
    requireClick: true,
    mascotSide: 'above',
  },
  {
    tab: 'train', color: '#3b82f6',
    title: 'Every day has a START button',
    body: "Scroll down here and tap START on today's workout — I'll walk you through every set. Hit Next when you're ready.",
    expression: 'point_down',
    find: null,
  },
  {
    tab: 'ranks', color: '#f59e0b',
    title: 'RANKS shows your strength',
    body: "Tap RANKS at the bottom to peek at your rank screen.",
    expression: 'point_down',
    find: () => findNavButton('Ranks'),
    requireClick: true,
    mascotSide: 'above',
  },
  {
    tab: 'more', color: '#a78bfa',
    title: 'Everything else lives in MORE',
    body: "Goals, settings, friends, AI chat — tap MORE to open it.",
    expression: 'point_down',
    find: () => findNavButton('More'),
    requireClick: true,
    mascotSide: 'above',
  },
  {
    tab: 'home', color: '#84cc16',
    title: 'Your AI Coach is one tap away',
    body: "That floating button is me! Tap it any time for advice on food, training, or motivation. Hit Next to finish setup!",
    expression: 'point_right',
    find: findCoachFab,
    mascotSide: 'left',
  },
]

// ─── PR entry overlay (unchanged) ─────────────────────────────────────────────

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

interface Rect { top: number; left: number; width: number; height: number }

export function AppTutorial({ onTabChange }: AppTutorialProps) {
  const { nutrition } = useApp()
  const [phase, setPhase] = useState<'tutorial' | 'pr' | 'done'>('done')
  const [current, setCurrent] = useState(0)
  const [dir, setDir] = useState(1)
  const [rect, setRect] = useState<Rect | null>(null)
  const targetRef = useRef<HTMLElement | null>(null)
  const clickHandlerRef = useRef<((e: Event) => void) | null>(null)

  // Total meal entries — used to detect "user logged a meal" for the wait step.
  const totalEntries =
    nutrition.meals.breakfast.length +
    nutrition.meals.lunch.length +
    nutrition.meals.dinner.length +
    nutrition.meals.snacks.length
  const baselineEntriesRef = useRef(totalEntries)

  useEffect(() => {
    try { if (!localStorage.getItem(STORAGE_KEY)) setPhase('tutorial') } catch {}
  }, [])

  const goNext = useCallback(() => {
    setCurrent(c => {
      if (c < STEPS.length - 1) { setDir(1); return c + 1 }
      setPhase('pr')
      return c
    })
  }, [])

  const goPrev = useCallback(() => {
    setCurrent(c => (c > 0 ? (setDir(-1), c - 1) : c))
  }, [])

  // Detach any click handler attached to a previous target.
  const detachClick = useCallback(() => {
    if (targetRef.current && clickHandlerRef.current) {
      targetRef.current.removeEventListener('click', clickHandlerRef.current, true)
    }
    targetRef.current = null
    clickHandlerRef.current = null
  }, [])

  // Effect: when step changes — switch tab, then poll for target, scroll into view, attach listeners.
  useEffect(() => {
    if (phase !== 'tutorial') return
    const step = STEPS[current]
    onTabChange(step.tab)
    detachClick()
    setRect(null)

    // Snapshot baseline entry count when entering the "pick a food" wait step.
    if (current === 4) {
      baselineEntriesRef.current = totalEntries
    }

    if (!step.find) {
      // Centered card step (no DOM target). Scroll to top of page.
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    let cancelled = false
    let pollCount = 0
    let raf = 0

    const lockOn = (el: HTMLElement) => {
      targetRef.current = el
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      // Wait for scroll to settle then measure
      window.setTimeout(() => {
        if (cancelled) return
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }, 450)

      if (step.requireClick) {
        const handler = () => {
          // Defer a tick so the click's own state updates happen first.
          window.setTimeout(() => goNext(), 50)
        }
        clickHandlerRef.current = handler
        el.addEventListener('click', handler, true)
      }
    }

    const poll = () => {
      if (cancelled) return
      const el = step.find!()
      if (el) { lockOn(el); return }
      pollCount++
      if (pollCount > 60) return // ~3s — give up and just show text
      raf = window.setTimeout(poll, 50) as unknown as number
    }
    poll()

    // Re-measure on scroll/resize while the target is live.
    const remeasure = () => {
      if (!targetRef.current) return
      const r = targetRef.current.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    window.addEventListener('scroll', remeasure, true)
    window.addEventListener('resize', remeasure)

    return () => {
      cancelled = true
      if (raf) clearTimeout(raf)
      window.removeEventListener('scroll', remeasure, true)
      window.removeEventListener('resize', remeasure)
      detachClick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, phase, onTabChange])

  // Auto-advance from the "pick a food" step the moment a new entry is added.
  useEffect(() => {
    if (phase !== 'tutorial') return
    if (current !== 4) return
    if (totalEntries > baselineEntriesRef.current) {
      const t = window.setTimeout(() => goNext(), 350)
      return () => clearTimeout(t)
    }
  }, [totalEntries, current, phase, goNext])

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, 'seen') } catch {}
    window.scrollTo({ top: 0 })
    setPhase('done')
    onTabChange('home')
  }

  if (phase === 'pr') return <AnimatePresence><PREntryOverlay onComplete={finish} /></AnimatePresence>
  if (phase !== 'tutorial') return null

  const step = STEPS[current]
  const isFirst = current === 0
  const isLast = current === STEPS.length - 1
  const isWaitingForUserAction = !!step.requireClick || current === 4

  // Compute mascot position from spotlight rect (with screen-edge padding).
  const VW = typeof window !== 'undefined' ? window.innerWidth : 390
  const VH = typeof window !== 'undefined' ? window.innerHeight : 844
  const MASCOT = 90
  let mascotStyle: React.CSSProperties = { left: '50%', top: '32%', transform: 'translate(-50%, -50%)' }
  if (rect && step.find) {
    const side = step.mascotSide || 'above'
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let mx = cx, my = cy
    const GAP = 70
    if (side === 'above')  { my = Math.max(80, rect.top - GAP) }
    if (side === 'below')  { my = Math.min(VH - 280, rect.top + rect.height + GAP) }
    if (side === 'left')   { mx = Math.max(70, rect.left - GAP); my = cy }
    if (side === 'right')  { mx = Math.min(VW - 70, rect.left + rect.width + GAP); my = cy }
    mascotStyle = { left: mx, top: my, transform: 'translate(-50%, -50%)' }
  }

  // Spotlight rect (with a little padding) — px-based so it always tracks the real element.
  const PAD = 8
  const spot = rect ? {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  } : null

  return (
    <AnimatePresence>
      <motion.div key="tut"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-hidden"
        style={{ pointerEvents: 'none' }}>

        {/* SVG dim layer with a hole punched over the spotlight so the target stays clickable */}
        <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: 'none' }}>
          <defs>
            <mask id="rize-tut-mask">
              <rect width="100%" height="100%" fill="white" />
              {spot && (
                <rect
                  x={spot.left} y={spot.top}
                  width={spot.width} height={spot.height}
                  rx={16} ry={16} fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#rize-tut-mask)" />
        </svg>

        {/* Skip */}
        <div className="absolute top-0 left-0 right-0 flex justify-end px-5 pt-14" style={{ pointerEvents: 'auto' }}>
          <button type="button" onClick={finish}
            className="flex items-center gap-1.5 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white/70 border border-white/10">
            Skip tour <X className="h-3 w-3" />
          </button>
        </div>

        {/* Animated spotlight ring */}
        {spot && (
          <motion.div
            key={`spot-${current}`}
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="absolute pointer-events-none"
            style={{
              top: spot.top, left: spot.left, width: spot.width, height: spot.height,
              borderRadius: 16,
              border: `3px solid ${step.color}`,
              boxShadow: `0 0 0 4px ${step.color}30, 0 0 40px 8px ${step.color}66`,
            }}
          />
        )}

        {/* Pulsing tap hint on click-required steps */}
        {spot && step.requireClick && (
          <motion.div
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
              top: spot.top + spot.height / 2 - 18,
              left: spot.left + spot.width / 2 - 18,
              width: 36, height: 36,
            }}
            animate={{ scale: [1, 1.35, 1], opacity: [0.9, 0.4, 0.9] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <MousePointerClick className="h-7 w-7" style={{ color: step.color }} />
          </motion.div>
        )}

        {/* Mascot — bounces near the highlighted element */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`mascot-${current}-${rect ? '1' : '0'}`}
            className="absolute pointer-events-none z-[65]"
            style={mascotStyle}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{
              opacity: { duration: 0.25 },
              scale:   { duration: 0.45, type: 'spring', bounce: 0.5 },
              y:       { duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
            }}
          >
            <RizeFace size={MASCOT} accent={step.color} expression={step.expression} />
          </motion.div>
        </AnimatePresence>

        {/* Bottom panel */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 pt-6 bg-gradient-to-t from-black/95 via-black/85 to-transparent" style={{ pointerEvents: 'auto' }}>

          {/* Page tag + counter */}
          <div className="flex items-center justify-between mb-3">
            <div className="rounded-full px-3.5 py-1.5 text-xs font-black border uppercase tracking-wider"
              style={{ backgroundColor: step.color + '25', color: step.color, borderColor: step.color + '50' }}>
              {step.tab} page
            </div>
            <span className="text-xs font-semibold text-white/40">{current + 1} / {STEPS.length}</span>
          </div>

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
              <button type="button" onClick={goPrev}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white active:scale-95 transition-transform">
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            )}
            {isWaitingForUserAction ? (
              <div
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white/70 border border-white/15 bg-white/5"
              >
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                >
                  {current === 4 ? 'Waiting for you to add a food…' : 'Tap the highlighted button to continue'}
                </motion.span>
              </div>
            ) : (
              <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={goNext}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-black"
                style={{ backgroundColor: step.color, boxShadow: `0 8px 32px ${step.color}60` }}>
                {isLast
                  ? <><CheckCircle2 className="h-5 w-5" /> Done — set my rank!</>
                  : <><ArrowRight className="h-5 w-5" /> Next</>}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
