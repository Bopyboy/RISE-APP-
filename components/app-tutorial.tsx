'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft as ArrowLeftIcon, X, CheckCircle2, Star, MousePointerClick, Sparkles } from 'lucide-react'
import { useApp } from '@/lib/app-context'

const STORAGE_KEY = 'rise-tutorial-v8-seen'

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
  const pieces = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.0,
    duration: 1.5 + Math.random() * 1.8,
    color: ['#84cc16','#f97316','#3b82f6','#f59e0b','#ec4899','#a78bfa','#06b6d4'][i % 7],
    size: 5 + Math.random() * 12,
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

// ─── DOM targeting ────────────────────────────────────────────────────────────

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
  // Find the button whose <span> label matches exactly.
  const buttons = Array.from(nav.querySelectorAll<HTMLElement>('button'))
  return buttons.find(b => {
    const span = b.querySelector('span')
    return span && (span.textContent || '').trim().toLowerCase() === label.toLowerCase()
  }) || findByText('button', label, nav)
}

const findBreakfastAdd: Finder = () => {
  const headings = Array.from(document.querySelectorAll<HTMLElement>('h3'))
  const heading = headings.find(h => (h.textContent || '').trim().toLowerCase() === 'breakfast')
  if (!heading) return null
  let card: HTMLElement | null = heading
  for (let i = 0; i < 6 && card; i++) {
    if (card.className && /rounded-2xl/.test(card.className)) break
    card = card.parentElement
  }
  if (!card) card = heading.parentElement?.parentElement?.parentElement || null
  if (!card) return null
  return findByText('button', 'Add', card)
}

const findCoachFab: Finder = () => {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('button'))
  return candidates.find(b => {
    if (b.closest('nav')) return false
    const cs = getComputedStyle(b)
    if (cs.position !== 'fixed') return false
    const r = b.getBoundingClientRect()
    return r.bottom > window.innerHeight - 220 && r.right > window.innerWidth - 160 && r.width < 200 && r.width > 30
  }) || null
}

// ─── Step config ──────────────────────────────────────────────────────────────

interface Step {
  tab: string
  color: string
  title: string
  body: string
  expression: Expression
  find: Finder | null
  requireClick?: boolean
  waitForMeal?: boolean
}

const STEPS: Step[] = [
  {
    tab: 'home', color: '#84cc16',
    title: "Hey! I'm Rize 👋",
    body: "I'm your personal coach. Let me give you a quick 30-second tour and help you log your very first meal. Ready?",
    expression: 'excited',
    find: null,
  },
  {
    tab: 'home', color: '#84cc16',
    title: 'This is your Home base',
    body: "Your daily streak, calories, and shortcuts live here. You'll come back every day. Let's log a meal next!",
    expression: 'happy',
    find: null,
  },
  {
    tab: 'home', color: '#f97316',
    title: 'Tap the FOOD button',
    body: "It's highlighted at the bottom of your screen. Tap it now — I'll wait!",
    expression: 'point_down',
    find: () => findNavButton('Food'),
    requireClick: true,
  },
  {
    tab: 'food', color: '#f97316',
    title: 'Tap "+ Add" on Breakfast',
    body: "This opens the food picker. Pick anything you ate — even a guess works for this tour.",
    expression: 'point_right',
    find: findBreakfastAdd,
    requireClick: true,
  },
  {
    tab: 'food', color: '#f97316',
    title: 'Pick any food to log it',
    body: "Search or browse a category, then hit Add. I'll wait right here…",
    expression: 'excited',
    find: null,
    waitForMeal: true,
  },
  {
    tab: 'food', color: '#84cc16',
    title: "Boom — first meal logged! 🎉",
    body: "That's the whole flow. Every meal works the same way. Now let me show you the rest fast.",
    expression: 'excited',
    find: null,
  },
  {
    tab: 'home', color: '#3b82f6',
    title: 'TRAIN is for workouts',
    body: "Tap TRAIN at the bottom-left to see your workout plan.",
    expression: 'point_down',
    find: () => findNavButton('Train'),
    requireClick: true,
  },
  {
    tab: 'train', color: '#3b82f6',
    title: "Hit START on today's workout",
    body: "Each day has a START button — tap it and I'll walk you through every set and rep. Hit Next when you've seen it.",
    expression: 'happy',
    find: null,
  },
  {
    tab: 'ranks', color: '#f59e0b',
    title: 'RANKS shows your strength',
    body: "Tap the RANKS button to peek at your rank screen.",
    expression: 'point_down',
    find: () => findNavButton('Ranks'),
    requireClick: true,
  },
  {
    tab: 'more', color: '#a78bfa',
    title: 'Everything else lives in MORE',
    body: "Goals, settings, friends, AI chat — tap MORE to open it.",
    expression: 'point_down',
    find: () => findNavButton('More'),
    requireClick: true,
  },
  {
    tab: 'home', color: '#84cc16',
    title: 'Your AI Coach is one tap away',
    body: "That floating button is me. Tap it any time for advice on food, training, or motivation. Hit Next to finish!",
    expression: 'point_right',
    find: findCoachFab,
  },
]

// ─── PR entry overlay ─────────────────────────────────────────────────────────

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

const CARD_W = 340
const CARD_GAP = 26 // distance between spotlight edge and coach card
const SAFE_X = 14
const SAFE_TOP = 60
const SAFE_BOTTOM = 24

export function AppTutorial({ onTabChange }: AppTutorialProps) {
  const { nutrition } = useApp()
  const [phase, setPhase] = useState<'tutorial' | 'pr' | 'done'>('done')
  const [current, setCurrent] = useState(0)
  const [dir, setDir] = useState(1)
  const [rect, setRect] = useState<Rect | null>(null)
  const [viewport, setViewport] = useState({ w: 390, h: 844 })
  const targetRef = useRef<HTMLElement | null>(null)
  const clickHandlerRef = useRef<((e: Event) => void) | null>(null)

  const totalEntries =
    nutrition.meals.breakfast.length +
    nutrition.meals.lunch.length +
    nutrition.meals.dinner.length +
    nutrition.meals.snacks.length
  const baselineEntriesRef = useRef(totalEntries)

  useEffect(() => {
    try { if (!localStorage.getItem(STORAGE_KEY)) setPhase('tutorial') } catch {}
    const updateVP = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    updateVP()
    window.addEventListener('resize', updateVP)
    return () => window.removeEventListener('resize', updateVP)
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

  const detachClick = useCallback(() => {
    if (targetRef.current && clickHandlerRef.current) {
      targetRef.current.removeEventListener('click', clickHandlerRef.current, true)
    }
    targetRef.current = null
    clickHandlerRef.current = null
  }, [])

  // Step lifecycle: switch tab, find DOM target, scroll into view, attach click listener.
  useEffect(() => {
    if (phase !== 'tutorial') return
    const step = STEPS[current]
    onTabChange(step.tab)
    detachClick()
    setRect(null)

    if (step.waitForMeal) {
      baselineEntriesRef.current = totalEntries
    }

    if (!step.find) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    let cancelled = false
    let pollCount = 0
    let pollTimer: ReturnType<typeof setTimeout> | null = null

    const lockOn = (el: HTMLElement) => {
      targetRef.current = el
      // Avoid scrolling for fixed-position elements (bottom nav, coach FAB).
      const isFixed = getComputedStyle(el).position === 'fixed' || !!el.closest('nav')
      if (!isFixed) el.scrollIntoView({ block: 'center', behavior: 'smooth' })

      window.setTimeout(() => {
        if (cancelled) return
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      }, isFixed ? 60 : 450)

      if (step.requireClick) {
        const handler = () => {
          window.setTimeout(() => goNext(), 60)
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
      if (pollCount > 80) return
      pollTimer = setTimeout(poll, 60)
    }
    poll()

    const remeasure = () => {
      if (!targetRef.current) return
      const r = targetRef.current.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    window.addEventListener('scroll', remeasure, true)
    window.addEventListener('resize', remeasure)

    return () => {
      cancelled = true
      if (pollTimer) clearTimeout(pollTimer)
      window.removeEventListener('scroll', remeasure, true)
      window.removeEventListener('resize', remeasure)
      detachClick()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, phase, onTabChange])

  // Auto-advance the "pick a food" step the moment a new meal entry is added.
  useEffect(() => {
    if (phase !== 'tutorial') return
    if (!STEPS[current].waitForMeal) return
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

  // ─── Layout math: spotlight + card placement ───────────────────────────────

  const PAD = 10
  const spot = rect ? {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  } : null

  const placement = useMemo(() => {
    const { w: VW, h: VH } = viewport
    const cardW = Math.min(CARD_W, VW - SAFE_X * 2)
    // Estimated card height — used to decide above vs below; real height auto.
    const ESTIMATED_H = 250

    if (!spot) {
      // Centered card (welcome / celebration steps)
      return {
        cardLeft: (VW - cardW) / 2,
        cardTop: Math.max(SAFE_TOP + 20, (VH - ESTIMATED_H) / 2 - 20),
        cardW,
        tail: null as null | { side: 'top' | 'bottom'; x: number },
        anchorXY: { x: VW / 2, y: VH / 2 },
      }
    }

    const cx = spot.left + spot.width / 2
    const cy = spot.top + spot.height / 2

    // Prefer placing the card on whichever side has more room.
    const roomAbove = spot.top - SAFE_TOP
    const roomBelow = VH - (spot.top + spot.height) - SAFE_BOTTOM
    const placeAbove = roomAbove >= ESTIMATED_H + CARD_GAP || roomAbove > roomBelow

    let cardTop: number
    let tailSide: 'top' | 'bottom'
    if (placeAbove) {
      cardTop = Math.max(SAFE_TOP, spot.top - CARD_GAP - ESTIMATED_H)
      tailSide = 'bottom' // tail on card's bottom edge, pointing down to spot
    } else {
      cardTop = Math.min(VH - SAFE_BOTTOM - ESTIMATED_H, spot.top + spot.height + CARD_GAP)
      tailSide = 'top' // tail on top edge, pointing up to spot
    }

    let cardLeft = Math.max(SAFE_X, Math.min(VW - cardW - SAFE_X, cx - cardW / 2))
    const tailX = Math.max(28, Math.min(cardW - 28, cx - cardLeft))

    return {
      cardLeft,
      cardTop,
      cardW,
      tail: { side: tailSide, x: tailX },
      anchorXY: { x: cx, y: cy },
    }
  }, [spot, viewport])

  if (phase === 'pr') return <AnimatePresence><PREntryOverlay onComplete={finish} /></AnimatePresence>
  if (phase !== 'tutorial') return null

  const step = STEPS[current]
  const isFirst = current === 0
  const isLast = current === STEPS.length - 1
  const isWaiting = !!step.requireClick || !!step.waitForMeal

  return (
    <AnimatePresence>
      <motion.div key="tut"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60]"
        style={{ pointerEvents: 'none' }}>

        {/* Dim layer with a real hole over the spotlight (SVG mask). Targets stay clickable. */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none">
          <defs>
            <mask id="rize-tut-mask">
              <rect width="100%" height="100%" fill="white" />
              {spot && (
                <rect
                  x={spot.left} y={spot.top}
                  width={spot.width} height={spot.height}
                  rx={18} ry={18} fill="black"
                />
              )}
            </mask>
            <radialGradient id="rize-tut-vignette" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="rgba(8,10,20,0.55)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.92)" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#rize-tut-vignette)" mask="url(#rize-tut-mask)" />
        </svg>

        {/* Animated color glow around spotlight */}
        {spot && (
          <>
            <motion.div
              key={`glow-${current}`}
              className="absolute pointer-events-none"
              style={{
                top: spot.top - 40, left: spot.left - 40,
                width: spot.width + 80, height: spot.height + 80,
                borderRadius: 999,
                background: `radial-gradient(closest-side, ${step.color}55, transparent 70%)`,
                filter: 'blur(8px)',
              }}
              animate={{ opacity: [0.55, 0.95, 0.55] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Crisp ring */}
            <motion.div
              key={`ring-${current}`}
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 18, stiffness: 260 }}
              className="absolute pointer-events-none"
              style={{
                top: spot.top, left: spot.left, width: spot.width, height: spot.height,
                borderRadius: 18,
                border: `2.5px solid ${step.color}`,
                boxShadow: `0 0 0 4px ${step.color}25, inset 0 0 0 1px rgba(255,255,255,0.18)`,
              }}
            />
            {/* Expanding pulse ring */}
            <motion.div
              key={`pulse-${current}`}
              className="absolute pointer-events-none"
              style={{
                top: spot.top, left: spot.left, width: spot.width, height: spot.height,
                borderRadius: 18,
                border: `2px solid ${step.color}`,
              }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            />
          </>
        )}

        {/* Tap hint on click-required steps */}
        {spot && step.requireClick && (
          <motion.div
            className="absolute pointer-events-none flex items-center justify-center"
            style={{
              top: spot.top + spot.height - 6,
              left: spot.left + spot.width / 2 - 22,
              width: 44, height: 44,
            }}
            animate={{ y: [0, 6, 0], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full shadow-2xl"
              style={{ backgroundColor: step.color, boxShadow: `0 8px 24px ${step.color}aa` }}
            >
              <MousePointerClick className="h-5 w-5 text-black" />
            </div>
          </motion.div>
        )}

        {/* Skip pill — top right */}
        <div className="absolute top-0 right-0 px-4 pt-12" style={{ pointerEvents: 'auto' }}>
          <button type="button" onClick={finish}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-3.5 py-2 text-[11px] font-semibold text-white/70 backdrop-blur-md hover:bg-black/85 transition-colors">
            Skip tour <X className="h-3 w-3" />
          </button>
        </div>

        {/* Progress dots — top center */}
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-14 pointer-events-none">
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md">
            {STEPS.map((_, i) => (
              <motion.div key={i}
                animate={{
                  width: i === current ? 22 : 5,
                  opacity: i < current ? 0.55 : i === current ? 1 : 0.22,
                  backgroundColor: i === current ? step.color : '#ffffff',
                }}
                transition={{ duration: 0.25 }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* COACH CARD — floating, intelligently positioned, with mascot + speech tail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`card-${current}`}
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="absolute"
            style={{
              left: placement.cardLeft,
              top: placement.cardTop,
              width: placement.cardW,
              pointerEvents: 'auto',
            }}
          >
            {/* Mascot floats above the card, peeking */}
            <div className="relative">
              <motion.div
                className="absolute -top-[58px] left-4 z-10"
                animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div
                  className="rounded-full p-1"
                  style={{
                    background: `radial-gradient(circle, ${step.color}55, transparent 70%)`,
                    filter: 'blur(0.5px)',
                  }}
                >
                  <RizeFace size={68} accent={step.color} expression={step.expression} />
                </div>
              </motion.div>

              {/* Tag chip top-right of card */}
              <div className="absolute -top-3 right-3 z-10">
                <div
                  className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg"
                  style={{
                    backgroundColor: step.color,
                    color: '#0a0a0a',
                    borderColor: 'rgba(255,255,255,0.4)',
                    boxShadow: `0 4px 16px ${step.color}66`,
                  }}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {step.tab}
                </div>
              </div>

              {/* Card body — glass with colored border */}
              <div
                className="relative rounded-3xl border bg-zinc-950/95 px-5 pb-5 pt-9 shadow-2xl backdrop-blur-xl overflow-hidden"
                style={{
                  borderColor: `${step.color}55`,
                  boxShadow: `0 20px 60px -10px rgba(0,0,0,0.7), 0 0 0 1px ${step.color}22, 0 0 40px -10px ${step.color}55`,
                }}
              >
                {/* Color wash at top of card */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30"
                  style={{ background: `radial-gradient(120% 100% at 30% 0%, ${step.color}, transparent 65%)` }}
                />

                {/* Step counter */}
                <div className="relative mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: step.color }}>
                    Step {current + 1} of {STEPS.length}
                  </span>
                </div>

                {/* Sliding text */}
                <AnimatePresence mode="wait">
                  <motion.div key={current}
                    initial={{ opacity: 0, x: dir * 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dir * -20 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    className="relative mb-4"
                  >
                    <h2 className="text-[1.05rem] font-black leading-tight text-white mb-1.5">{step.title}</h2>
                    <p className="text-[0.85rem] leading-relaxed text-white/72">{step.body}</p>
                  </motion.div>
                </AnimatePresence>

                {/* Action row */}
                <div className="relative flex gap-2">
                  {!isFirst && (
                    <button type="button" onClick={goPrev}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition-transform active:scale-95">
                      <ArrowLeftIcon className="h-4 w-4" />
                    </button>
                  )}
                  {isWaiting ? (
                    <div
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white/70"
                    >
                      <motion.span
                        className="inline-flex h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: step.color }}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      />
                      {step.waitForMeal ? 'Waiting for you to add a food…' : 'Tap the highlighted button'}
                    </div>
                  ) : (
                    <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={goNext}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[14px] font-black text-black"
                      style={{
                        backgroundColor: step.color,
                        boxShadow: `0 8px 24px ${step.color}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
                      }}
                    >
                      {isLast
                        ? <><CheckCircle2 className="h-4 w-4" /> Done — set my rank!</>
                        : <><ArrowRight className="h-4 w-4" /> Got it, next</>}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Speech-bubble tail pointing toward the spotlight */}
              {placement.tail && (
                <div
                  className="absolute"
                  style={{
                    left: placement.tail.x - 10,
                    [placement.tail.side === 'bottom' ? 'bottom' : 'top']: -9,
                    width: 20, height: 12,
                    pointerEvents: 'none',
                  }}
                >
                  <svg viewBox="0 0 20 12" className="h-full w-full">
                    {placement.tail.side === 'bottom' ? (
                      <path d="M0 0 L20 0 L10 12 Z" fill="#09090b" stroke={`${step.color}55`} strokeWidth="1" />
                    ) : (
                      <path d="M0 12 L20 12 L10 0 Z" fill="#09090b" stroke={`${step.color}55`} strokeWidth="1" />
                    )}
                  </svg>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
