'use client'

import { useState, useMemo } from 'react'
import { useApp } from '@/lib/app-context'
import { MUSCLE_COLORS, MuscleLevel, BodyChartPRs } from '@/lib/types'
import {
  PR_EXERCISE_GROUPS,
  PRGroup,
  getThresholds,
  getTierFromValue,
  getStrengthSummary,
  getExerciseSpec,
  StrengthProfile,
  calcE1RM,
  isBodyweightExercise,
  isWeightedExercise,
} from '@/lib/strength-standards'
import { calculatePerformanceScore, getRankByPerformance } from '@/lib/performance-rank'
import { RotateCcw, Info, Video, CheckCircle2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

function getGroupAverageLevel(
  prs: { [key: string]: number },
  exercises: { id: string }[],
  profile: StrengthProfile
): MuscleLevel {
  const levels: MuscleLevel[] = []
  for (const ex of exercises) {
    if (prs[ex.id] && prs[ex.id] > 0) {
      levels.push(getTierFromValue(prs[ex.id], getThresholds(ex.id, profile)))
    }
  }
  if (levels.length === 0) return 'untrained'

  const tierValues = { untrained: 0, beginner: 1, intermediate: 2, advanced: 3, elite: 4 }
  const avg = levels.reduce((sum, l) => sum + tierValues[l], 0) / levels.length

  if (avg < 0.5) return 'untrained'
  if (avg < 1.5) return 'beginner'
  if (avg < 2.5) return 'intermediate'
  if (avg < 3.5) return 'advanced'
  return 'elite'
}

// Premium color palette per level
const PREMIUM_COLORS: Record<MuscleLevel, { fill: string; glow: string; gradient: [string, string] }> = {
  untrained:    { fill: '#1e2028', glow: 'transparent',  gradient: ['#1e2028', '#252830'] },
  beginner:     { fill: '#dc2626', glow: '#dc2626',       gradient: ['#b91c1c', '#f87171'] },
  intermediate: { fill: '#ea7c18', glow: '#ea7c18',       gradient: ['#c2610f', '#fbbf24'] },
  advanced:     { fill: '#2563eb', glow: '#2563eb',       gradient: ['#1d4ed8', '#60a5fa'] },
  elite:        { fill: '#16a34a', glow: '#16a34a',       gradient: ['#15803d', '#4ade80'] },
}

const TIER_LABELS: Record<MuscleLevel, string> = {
  untrained: 'Untrained',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
}

function MusclePath({
  id, d, level, name, onHover, onLeave,
}: {
  id: string
  d: string
  level: MuscleLevel
  name: string
  onHover: (name: string, level: MuscleLevel, e: React.MouseEvent | React.TouchEvent) => void
  onLeave: () => void
}) {
  const c = PREMIUM_COLORS[level]
  return (
    <path
      key={id}
      d={d}
      fill={`url(#grad-${id})`}
      style={{
        filter: level !== 'untrained'
          ? `drop-shadow(0 0 6px ${c.glow}88) drop-shadow(0 0 2px ${c.glow}cc)`
          : undefined,
        opacity: level === 'untrained' ? 0.45 : 1,
        transition: 'all 0.3s ease',
      }}
      className="cursor-pointer"
      onMouseEnter={e => onHover(name, level, e)}
      onMouseLeave={onLeave}
      onTouchStart={e => onHover(name, level, e)}
      onTouchEnd={onLeave}
    />
  )
}

function BodySVG({ view, muscleLevels }: { view: 'front' | 'back'; muscleLevels: Record<string, MuscleLevel> }) {
  const [tooltip, setTooltip] = useState<{ name: string; level: MuscleLevel; cx: number; cy: number } | null>(null)

  const handleHover = (name: string, level: MuscleLevel, e: React.MouseEvent | React.TouchEvent) => {
    const svgEl = (e.currentTarget as SVGElement).closest('svg')
    const containerEl = svgEl?.parentElement
    if (!containerEl || !svgEl) return
    const pathRect = (e.currentTarget as SVGElement).getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()
    setTooltip({
      name, level,
      cx: pathRect.left + pathRect.width / 2 - containerRect.left,
      cy: pathRect.top - containerRect.top,
    })
  }

  // Clean, modern muscle group design - front view
  const frontMuscles = [
    // CHEST - two connected pecs
    { id: 'chest-left', name: 'Chest', level: muscleLevels.chest,
      d: 'M65 90 Q60 95 60 110 Q62 125 70 135 Q78 138 85 133 Q85 115 82 100 Q78 92 70 90 Z' },
    { id: 'chest-right', name: 'Chest', level: muscleLevels.chest,
      d: 'M135 90 Q140 95 140 110 Q138 125 130 135 Q122 138 115 133 Q115 115 118 100 Q122 92 130 90 Z' },

    // SHOULDERS - rounded deltoids
    { id: 'shoulder-left', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M55 95 Q45 100 42 115 Q42 130 52 138 Q62 135 68 125 Q70 110 65 100 Z' },
    { id: 'shoulder-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M145 95 Q155 100 158 115 Q158 130 148 138 Q138 135 132 125 Q130 110 135 100 Z' },

    // BICEPS - upper arm front
    { id: 'bicep-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M48 140 Q42 160 42 180 Q44 195 52 200 Q60 195 62 175 Q62 158 58 145 Z' },
    { id: 'bicep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M152 140 Q158 160 158 180 Q156 195 148 200 Q140 195 138 175 Q138 158 142 145 Z' },

    // FOREARMS
    { id: 'forearm-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M42 205 Q38 225 40 245 Q44 255 52 258 Q58 252 60 235 Q60 220 55 210 Z' },
    { id: 'forearm-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M158 205 Q162 225 160 245 Q156 255 148 258 Q142 252 140 235 Q140 220 145 210 Z' },

    // ABS - clean 6-pack grid
    { id: 'abs-upper-left', name: 'Core', level: muscleLevels.core,
      d: 'M92 140 Q97 142 100 140 Q103 142 108 140 L108 155 Q100 157 92 155 Z' },
    { id: 'abs-upper-right', name: 'Core', level: muscleLevels.core,
      d: 'M92 140 Q97 142 100 140 L100 155 Q97 157 92 155 Z' },

    { id: 'abs-mid-left', name: 'Core', level: muscleLevels.core,
      d: 'M92 158 Q97 160 100 158 Q103 160 108 158 L108 173 Q100 175 92 173 Z' },
    { id: 'abs-mid-right', name: 'Core', level: muscleLevels.core,
      d: 'M92 158 Q97 160 100 158 L100 173 Q97 175 92 173 Z' },

    { id: 'abs-lower-left', name: 'Core', level: muscleLevels.core,
      d: 'M92 176 Q97 178 100 176 Q103 178 108 176 L108 191 Q100 193 92 191 Z' },
    { id: 'abs-lower-right', name: 'Core', level: muscleLevels.core,
      d: 'M92 176 Q97 178 100 176 L100 191 Q97 193 92 191 Z' },

    // QUADS - clean thigh muscles
    { id: 'quad-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M68 205 Q62 235 62 270 Q65 295 78 305 L88 300 Q85 270 88 240 Q88 220 80 210 Z' },
    { id: 'quad-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M132 205 Q138 235 138 270 Q135 295 122 305 L112 300 Q115 270 112 240 Q112 220 120 210 Z' },

    // CALVES
    { id: 'calf-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M65 310 Q60 335 62 360 Q66 375 75 380 L82 372 Q80 350 80 330 Z' },
    { id: 'calf-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M135 310 Q140 335 138 360 Q134 375 125 380 L118 372 Q120 350 120 330 Z' },
  ]

  // Back view muscles
  const backMuscles = [
    // TRAPS - upper back
    { id: 'trap-left', name: 'Back', level: muscleLevels.back,
      d: 'M100 85 Q85 90 75 105 Q70 120 80 135 L95 125 Q98 105 100 92 Z' },
    { id: 'trap-right', name: 'Back', level: muscleLevels.back,
      d: 'M100 85 Q115 90 125 105 Q130 120 120 135 L105 125 Q102 105 100 92 Z' },

    // LATS - large back muscles
    { id: 'lat-left', name: 'Back', level: muscleLevels.back,
      d: 'M75 135 Q62 155 62 180 Q64 210 80 225 L95 215 Q92 190 95 160 Q98 140 92 135 Z' },
    { id: 'lat-right', name: 'Back', level: muscleLevels.back,
      d: 'M125 135 Q138 155 138 180 Q136 210 120 225 L105 215 Q108 190 105 160 Q102 140 108 135 Z' },

    // REAR SHOULDERS
    { id: 'rear-shoulder-left', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M55 100 Q42 110 40 128 Q42 145 58 150 Q70 140 75 120 Z' },
    { id: 'rear-shoulder-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M145 100 Q158 110 160 128 Q158 145 142 150 Q130 140 125 120 Z' },

    // TRICEPS - back of arms
    { id: 'tricep-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M40 155 Q32 180 32 205 Q35 230 48 240 Q58 230 62 210 Q62 180 56 160 Z' },
    { id: 'tricep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M160 155 Q168 180 168 205 Q165 230 152 240 Q142 230 138 210 Q138 180 144 160 Z' },

    // FOREARMS - back
    { id: 'back-forearm-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M32 245 Q28 268 32 290 Q38 305 50 310 Q58 302 60 285 Q58 265 52 250 Z' },
    { id: 'back-forearm-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M168 245 Q172 268 168 290 Q162 305 150 310 Q142 302 140 285 Q142 265 148 250 Z' },

    // GLUTES
    { id: 'glute-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M78 230 Q68 250 70 270 L100 275 L100 235 Q90 228 78 230 Z' },
    { id: 'glute-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M122 230 Q132 250 130 270 L100 275 L100 235 Q110 228 122 230 Z' },

    // HAMSTRINGS
    { id: 'hamstring-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M72 280 Q65 310 68 340 Q73 360 85 368 L92 360 Q88 335 88 305 Z' },
    { id: 'hamstring-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M128 280 Q135 310 132 340 Q127 360 115 368 L108 360 Q112 335 112 305 Z' },

    // CALVES - back
    { id: 'calf-back-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M68 375 Q62 400 65 428 Q70 445 80 450 L87 440 Q85 415 85 390 Z' },
    { id: 'calf-back-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M132 375 Q138 400 135 428 Q130 445 120 450 L113 440 Q115 415 115 390 Z' },
  ]

  const muscles = view === 'front' ? frontMuscles : backMuscles

  // Build gradient defs
  const gradientDefs = muscles.map(m => {
    const c = PREMIUM_COLORS[m.level]
    return (
      <linearGradient key={`grad-${m.id}`} id={`grad-${m.id}`} x1="0%" y1="0%" x2="40%" y2="100%">
        <stop offset="0%" stopColor={c.gradient[1]} stopOpacity="1" />
        <stop offset="100%" stopColor={c.gradient[0]} stopOpacity="1" />
      </linearGradient>
    )
  })

  return (
    <div className="relative flex justify-center">
      <svg viewBox="0 0 200 480" className="h-[420px] w-auto drop-shadow-2xl">
        <defs>
          {gradientDefs}
        </defs>

        {/* Subtle body outline */}
        <g opacity="0.15">
          <ellipse cx="100" cy="60" rx="18" ry="22" fill="rgba(200,200,200,0.3)" />
          <path
            d="M60 95 L50 200 L52 280 L70 380 L100 460 L130 380 L148 280 L150 200 L140 95 Q100 80 60 95 Z"
            fill="rgba(200,200,200,0.2)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.5"
          />
        </g>

        {/* Muscle paths */}
        {muscles.map(m => (
          <MusclePath
            key={m.id}
            id={m.id}
            d={m.d}
            level={m.level}
            name={m.name}
            onHover={handleHover}
            onLeave={() => setTooltip(null)}
          />
        ))}

        {/* Light definition lines */}
        <g stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" fill="none" opacity="0.4">
          {view === 'front' ? (
            <>
              <line x1="100" y1="140" x2="100" y2="195" />
              <line x1="92" y1="155" x2="108" y2="155" />
              <line x1="92" y1="173" x2="108" y2="173" />
            </>
          ) : (
            <>
              <line x1="100" y1="85" x2="100" y2="225" />
            </>
          )}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: tooltip.cx, top: tooltip.cy - 8, transform: 'translate(-50%, -100%)' }}
        >
          <div
            className="rounded-xl px-3 py-2 shadow-xl backdrop-blur-md"
            style={{
              background: 'rgba(10,12,18,0.92)',
              border: `1px solid ${PREMIUM_COLORS[tooltip.level].fill}66`,
              boxShadow: `0 0 16px ${PREMIUM_COLORS[tooltip.level].glow}44`,
            }}
          >
            <p className="text-xs font-semibold text-white">{tooltip.name}</p>
            <p className="text-[10px] font-medium capitalize" style={{ color: PREMIUM_COLORS[tooltip.level].fill }}>
              {TIER_LABELS[tooltip.level]}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact score ring
function ScoreRing({ score, rank }: { score: number; rank: string }) {
  const radius = 36
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  const color =
    score > 80 ? '#16a34a' :
    score > 60 ? '#2563eb' :
    score > 40 ? '#ea7c18' :
    score > 20 ? '#dc2626' : '#4b5563'

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: 90, height: 90 }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
          <circle
            cx="45" cy="45" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 45 45)"
            style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black leading-none" style={{ color }}>{score}</span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-white/40">score</span>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-white/40">Strength Rank</p>
        <p className="mt-0.5 text-2xl font-black text-white">{rank}</p>
        <div className="mt-1.5 flex gap-1">
          {[20, 40, 60, 80, 100].map(threshold => (
            <div
              key={threshold}
              className="h-1.5 w-6 rounded-full"
              style={{
                backgroundColor: score >= threshold - 19
                  ? (threshold <= 20 ? '#dc2626' : threshold <= 40 ? '#ea7c18' : threshold <= 60 ? '#f59e0b' : threshold <= 80 ? '#2563eb' : '#16a34a')
                  : 'rgba(255,255,255,0.08)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function BodyChartPage() {
  const { bodyPRs, updateBodyPR, resetAllPRs, settings } = useApp()
  const [view, setView] = useState<'front' | 'back'>('front')
  const [activeTab, setActiveTab] = useState<PRGroup>('chest')
  const [verifiedVideos, setVerifiedVideos] = useState<Record<string, string>>({})
  const [videoModal, setVideoModal] = useState<{ url: string; name: string } | null>(null)
  const [rawWeights, setRawWeights] = useState<Record<string, number>>({})
  const [repsMap, setRepsMap] = useState<Record<string, number>>({})

  const handleWeightInput = (group: PRGroup, exerciseId: string, weight: number) => {
    setRawWeights(prev => ({ ...prev, [exerciseId]: weight }))
    const reps = repsMap[exerciseId] || 1
    updateBodyPR(group, exerciseId, calcE1RM(weight, reps))
  }

  const handleRepsInput = (group: PRGroup, exerciseId: string, reps: number) => {
    setRepsMap(prev => ({ ...prev, [exerciseId]: reps }))
    const weight = rawWeights[exerciseId] || 0
    if (weight > 0) updateBodyPR(group, exerciseId, calcE1RM(weight, reps))
  }

  const handleVideoUpload = (exerciseId: string, exerciseName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const url = URL.createObjectURL(e.target.files[0])
      setVerifiedVideos(prev => ({ ...prev, [exerciseId]: url }))
    }
  }

  const profile: StrengthProfile = useMemo(
    () => ({ age: settings.age, weightKg: settings.weight, gender: settings.gender }),
    [settings.age, settings.weight, settings.gender]
  )

  const bodyScore = calculatePerformanceScore(bodyPRs, profile)
  const scoreRank = getRankByPerformance(bodyScore).name

  const muscleLevels = {
    chest: getGroupAverageLevel(bodyPRs.chest, PR_EXERCISE_GROUPS.chest, profile),
    back: getGroupAverageLevel(bodyPRs.back, PR_EXERCISE_GROUPS.back, profile),
    shoulders: getGroupAverageLevel(bodyPRs.shoulders, PR_EXERCISE_GROUPS.shoulders, profile),
    arms: getGroupAverageLevel(bodyPRs.arms, PR_EXERCISE_GROUPS.arms, profile),
    legs: getGroupAverageLevel(bodyPRs.legs, PR_EXERCISE_GROUPS.legs, profile),
    core: getGroupAverageLevel(bodyPRs.core, PR_EXERCISE_GROUPS.core, profile),
  }

  const tabs = Object.entries(PR_EXERCISE_GROUPS).map(([id]) => ({
    id: id as PRGroup,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    level: muscleLevels[id as keyof typeof muscleLevels],
  }))

  const TIER_ORDER: MuscleLevel[] = ['untrained', 'beginner', 'intermediate', 'advanced', 'elite']

  return (
    <div className="space-y-4 pb-24">

      {/* Score Header */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <ScoreRing score={bodyScore} rank={scoreRank} />
        <p className="mt-3 text-[10px] leading-relaxed text-white/30">
          Standards calibrated for {settings.gender}, age {settings.age}, {settings.weight} kg
        </p>
      </div>

      {/* Body Graph Card */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, #0d0f14 0%, #080a10 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/80">Body Graph</h2>
          </div>
          {/* Front / Back toggle */}
          <div
            className="flex rounded-lg p-0.5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {(['front', 'back'] as const).map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-semibold capitalize transition-all duration-200',
                  view === v
                    ? 'bg-white text-black shadow'
                    : 'text-white/40 hover:text-white/70'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* SVG */}
        <div className="px-4 pb-2">
          <BodySVG view={view} muscleLevels={muscleLevels} />
        </div>

        {/* Legend */}
        <div
          className="mx-4 mb-4 flex items-center justify-between rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          {TIER_ORDER.map(level => (
            <div key={level} className="flex flex-col items-center gap-1">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: PREMIUM_COLORS[level].fill,
                  boxShadow: level !== 'untrained' ? `0 0 6px ${PREMIUM_COLORS[level].glow}` : undefined,
                }}
              />
              <span className="text-[9px] font-medium capitalize" style={{ color: PREMIUM_COLORS[level].fill }}>
                {level === 'intermediate' ? 'Inter.' : TIER_LABELS[level]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Muscle Group Tabs */}
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => {
          const c = PREMIUM_COLORS[tab.level]
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-shrink-0 flex-col items-center rounded-xl px-3 py-2 transition-all duration-200"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${c.gradient[0]}33, ${c.gradient[1]}1a)`
                  : 'rgba(255,255,255,0.04)',
                border: isActive
                  ? `1px solid ${c.fill}55`
                  : '1px solid rgba(255,255,255,0.07)',
                boxShadow: isActive ? `0 0 12px ${c.glow}22` : undefined,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: c.fill,
                  boxShadow: tab.level !== 'untrained' ? `0 0 5px ${c.glow}` : undefined,
                }}
              />
              <span
                className="mt-1 text-[11px] font-semibold"
                style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)' }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Exercise Cards */}
      <div className="space-y-2.5">
        {PR_EXERCISE_GROUPS[activeTab].map(exercise => {
          const e1rm = bodyPRs[activeTab][exercise.id] || 0
          const thresholds = getThresholds(exercise.id, profile)
          const tier = getTierFromValue(e1rm, thresholds)
          const spec = getExerciseSpec(exercise.id)
          const unit = spec?.unit ?? 'lbs'
          const c = PREMIUM_COLORS[tier]
          const weighted = isWeightedExercise(exercise.id)
          const bodyweight = isBodyweightExercise(exercise.id)
          const reps = repsMap[exercise.id] || 1
          const rawWeight = rawWeights[exercise.id] || 0

          return (
            <div
              key={exercise.id}
              className="overflow-hidden rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                border: `1px solid rgba(255,255,255,0.08)`,
              }}
            >
              <div className="p-4">
                {/* Top row: name + badge + video */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-semibold text-white truncate">{exercise.name}</p>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: `${c.fill}22`, color: c.fill, border: `1px solid ${c.fill}44` }}
                    >
                      {tier}
                    </span>
                  </div>
                  {verifiedVideos[exercise.id] ? (
                    <button
                      type="button"
                      onClick={() => setVideoModal({ url: verifiedVideos[exercise.id], name: exercise.name })}
                      className="shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold"
                      style={{ background: 'rgba(22,163,74,0.15)', color: '#4ade80', border: '1px solid rgba(22,163,74,0.3)' }}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </button>
                  ) : (
                    <label
                      className="shrink-0 flex cursor-pointer items-center justify-center rounded-xl p-2"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
                      title="Upload PR video proof"
                    >
                      <Video className="h-4 w-4 text-white/35" />
                      <input type="file" accept="video/*" className="hidden"
                        onChange={e => handleVideoUpload(exercise.id, exercise.name, e)} />
                    </label>
                  )}
                </div>

                {/* Input row */}
                <div className="flex items-end gap-2">
                  {weighted ? (
                    <>
                      {/* Weight */}
                      <div className="flex flex-col gap-1 flex-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-white/30">Weight (lbs)</span>
                        <input
                          type="number"
                          value={rawWeight || ''}
                          onChange={e => handleWeightInput(activeTab, exercise.id, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full rounded-xl py-2 px-3 text-center text-sm font-bold text-white placeholder-white/20 focus:outline-none focus:ring-1"
                          style={{
                            background: 'rgba(255,255,255,0.07)',
                            border: `1px solid ${rawWeight ? c.fill + '55' : 'rgba(255,255,255,0.1)'}`,
                            boxShadow: rawWeight ? `0 0 8px ${c.glow}22` : undefined,
                          }}
                        />
                      </div>

                      {/* × divider */}
                      <span className="mb-2 text-white/20 font-bold text-sm">×</span>

                      {/* Reps */}
                      <div className="flex flex-col gap-1 w-16">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-white/30">Reps</span>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={reps === 1 && !repsMap[exercise.id] ? '' : reps}
                          onChange={e => handleRepsInput(activeTab, exercise.id, parseInt(e.target.value) || 1)}
                          placeholder="1"
                          className="w-full rounded-xl py-2 px-2 text-center text-sm font-bold text-white placeholder-white/20 focus:outline-none focus:ring-1"
                          style={{
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.12)',
                          }}
                        />
                      </div>

                      {/* e1RM badge */}
                      {e1rm > 0 && (
                        <div
                          className="flex flex-col gap-0.5 items-center rounded-xl px-3 py-2 mb-0"
                          style={{ background: `${c.fill}15`, border: `1px solid ${c.fill}33` }}
                        >
                          <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: c.fill }}>e1RM</span>
                          <span className="text-sm font-black" style={{ color: c.fill }}>{e1rm}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Bodyweight / reps / time — single input */
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-white/30">
                        {unit === 'sec' ? 'Seconds' : 'Reps'}
                      </span>
                      <input
                        type="number"
                        value={e1rm || ''}
                        onChange={e => updateBodyPR(activeTab, exercise.id, parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full rounded-xl py-2 px-3 text-center text-sm font-bold text-white placeholder-white/20 focus:outline-none focus:ring-1"
                        style={{
                          background: 'rgba(255,255,255,0.07)',
                          border: `1px solid ${e1rm ? c.fill + '55' : 'rgba(255,255,255,0.1)'}`,
                          boxShadow: e1rm ? `0 0 8px ${c.glow}22` : undefined,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Subtitle */}
                {e1rm > 0 && (
                  <p className="mt-2 text-[11px] text-white/35">
                    {getStrengthSummary(exercise.id, e1rm, profile)}
                    {weighted && reps > 1 && (
                      <span className="text-white/25"> · {rawWeight} lbs × {reps} reps</span>
                    )}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    {(['beginner', 'intermediate', 'advanced', 'elite'] as MuscleLevel[]).map((level, i) => (
                      <div
                        key={level}
                        className="h-full flex-1 transition-all duration-500"
                        style={{
                          backgroundColor: e1rm >= thresholds[i + 1] ? PREMIUM_COLORS[level].fill : 'transparent',
                          borderRight: i < 3 ? '1px solid rgba(0,0,0,0.3)' : undefined,
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between">
                    {[1, 2, 3, 4].map(i => (
                      <span key={i} className="text-[9px] font-medium text-white/20">{thresholds[i]}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>


      {/* Info callout */}
      <div
        className="flex items-start gap-3 rounded-xl px-3 py-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/25" />
        <p className="text-[10px] leading-relaxed text-white/30">
          Thresholds scale with your age ({settings.age}), weight ({settings.weight} kg), and gender to ensure fair ranking across athlete types.
        </p>
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={resetAllPRs}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-red-500/60 transition-all hover:bg-red-500/08 hover:text-red-400"
        style={{ border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset all PRs
      </button>

      {/* Video Modal */}
      {videoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setVideoModal(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl"
            style={{ background: '#0d0f14', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-bold text-white">{videoModal.name}</p>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified PR
                </span>
              </div>
              <button
                type="button"
                onClick={() => setVideoModal(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/40 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                Close
              </button>
            </div>
            <video
              src={videoModal.url}
              controls
              autoPlay
              className="w-full bg-black"
              style={{ maxHeight: '60vh' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
