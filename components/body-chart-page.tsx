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
          ? `drop-shadow(0 0 8px ${c.glow}99) drop-shadow(0 0 3px ${c.glow}ff)`
          : undefined,
        opacity: level === 'untrained' ? 0.5 : 0.95,
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

  // Simple, clean rounded muscle blocks - FRONT view
  const frontMuscles = [
    // HEAD
    { id: 'head', name: 'Head', level: muscleLevels.chest,
      d: 'M100 30 Q115 30 120 45 Q120 60 100 65 Q80 60 80 45 Q85 30 100 30 Z' },

    // SHOULDERS (big rounded blocks)
    { id: 'shoulder-left', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M70 65 Q55 65 50 80 Q50 100 65 105 Q75 100 75 85 Z' },
    { id: 'shoulder-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M130 65 Q145 65 150 80 Q150 100 135 105 Q125 100 125 85 Z' },

    // CHEST (left & right)
    { id: 'chest-left', name: 'Chest', level: muscleLevels.chest,
      d: 'M75 85 Q70 85 68 100 Q68 120 80 130 Q90 128 92 110 Q92 95 85 85 Z' },
    { id: 'chest-right', name: 'Chest', level: muscleLevels.chest,
      d: 'M125 85 Q130 85 132 100 Q132 120 120 130 Q110 128 108 110 Q108 95 115 85 Z' },

    // ABS/CORE (center column)
    { id: 'abs', name: 'Core', level: muscleLevels.core,
      d: 'M90 110 Q95 108 100 108 Q105 108 110 110 L108 135 Q100 138 92 135 Z' },

    // BICEPS (left & right upper arms)
    { id: 'bicep-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M55 105 Q45 105 42 120 Q42 145 58 152 Q68 145 70 125 Q70 110 62 105 Z' },
    { id: 'bicep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M145 105 Q155 105 158 120 Q158 145 142 152 Q132 145 130 125 Q130 110 138 105 Z' },

    // FOREARMS (left & right lower arms)
    { id: 'forearm-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M40 155 Q32 155 30 170 Q32 190 45 195 Q55 188 58 172 Q57 160 48 155 Z' },
    { id: 'forearm-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M160 155 Q168 155 170 170 Q168 190 155 195 Q145 188 142 172 Q143 160 152 155 Z' },

    // QUADS (left & right upper leg - large blocks)
    { id: 'quad-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M80 138 Q72 138 70 160 Q72 200 85 220 Q95 215 98 185 Q100 158 92 138 Z' },
    { id: 'quad-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M120 138 Q128 138 130 160 Q128 200 115 220 Q105 215 102 185 Q100 158 108 138 Z' },

    // CALVES (left & right lower leg)
    { id: 'calf-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M78 225 Q72 225 70 245 Q72 270 82 280 Q90 272 90 250 Q90 230 85 225 Z' },
    { id: 'calf-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M122 225 Q128 225 130 245 Q128 270 118 280 Q110 272 110 250 Q110 230 115 225 Z' },
  ]

  // Back view muscles - SIMPLIFIED
  const backMuscles = [
    // HEAD
    { id: 'head-back', name: 'Head', level: muscleLevels.chest,
      d: 'M100 30 Q115 30 120 45 Q120 60 100 65 Q80 60 80 45 Q85 30 100 30 Z' },

    // TRAPS (top back)
    { id: 'trap-left', name: 'Back', level: muscleLevels.back,
      d: 'M75 70 Q65 75 62 90 Q65 105 80 108 Q88 100 88 85 Z' },
    { id: 'trap-right', name: 'Back', level: muscleLevels.back,
      d: 'M125 70 Q135 75 138 90 Q135 105 120 108 Q112 100 112 85 Z' },

    // LATS (large side back blocks)
    { id: 'lat-left', name: 'Back', level: muscleLevels.back,
      d: 'M55 110 Q40 120 38 145 Q42 175 65 190 Q80 180 82 150 Q82 125 72 110 Z' },
    { id: 'lat-right', name: 'Back', level: muscleLevels.back,
      d: 'M145 110 Q160 120 162 145 Q158 175 135 190 Q120 180 118 150 Q118 125 128 110 Z' },

    // REAR SHOULDERS
    { id: 'rear-shoulder-left', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M70 85 Q58 90 55 105 Q58 120 72 122 Q82 115 85 100 Z' },
    { id: 'rear-shoulder-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M130 85 Q142 90 145 105 Q142 120 128 122 Q118 115 115 100 Z' },

    // TRICEPS (back of arms)
    { id: 'tricep-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M40 150 Q30 160 28 180 Q32 205 50 215 Q62 205 65 180 Q62 160 50 150 Z' },
    { id: 'tricep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M160 150 Q170 160 172 180 Q168 205 150 215 Q138 205 135 180 Q138 160 150 150 Z' },

    // FOREARMS - back
    { id: 'back-forearm-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M28 220 Q22 235 24 255 Q30 270 45 278 Q55 268 58 250 Q55 230 42 220 Z' },
    { id: 'back-forearm-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M172 220 Q178 235 176 255 Q170 270 155 278 Q145 268 142 250 Q145 230 158 220 Z' },

    // GLUTES (butt)
    { id: 'glute-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M80 195 Q68 210 70 232 Q82 245 98 242 Q100 225 98 210 Z' },
    { id: 'glute-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M120 195 Q132 210 130 232 Q118 245 102 242 Q100 225 102 210 Z' },

    // HAMSTRINGS (back of thigh)
    { id: 'hamstring-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M75 250 Q68 270 70 295 Q78 315 90 325 Q98 310 98 280 Q98 260 88 250 Z' },
    { id: 'hamstring-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M125 250 Q132 270 130 295 Q122 315 110 325 Q102 310 102 280 Q102 260 112 250 Z' },

    // CALVES - back
    { id: 'calf-back-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M78 330 Q70 345 72 365 Q80 378 90 382 Q98 370 98 350 Z' },
    { id: 'calf-back-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M122 330 Q130 345 128 365 Q120 378 110 382 Q102 370 102 350 Z' },
  ]

  const muscles = view === 'front' ? frontMuscles : backMuscles

  // Build gradient defs
  const gradientDefs = muscles.map(m => {
    const c = PREMIUM_COLORS[m.level]
    return (
      <linearGradient key={`grad-${m.id}`} id={`grad-${m.id}`} x1="0%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={c.gradient[1]} stopOpacity="1" />
        <stop offset="100%" stopColor={c.gradient[0]} stopOpacity="1" />
      </linearGradient>
    )
  })

  return (
    <div className="relative flex justify-center">
      <svg viewBox="0 0 200 390" className="h-[360px] w-auto drop-shadow-2xl">
        <defs>
          {gradientDefs}
        </defs>

        {/* Muscle paths - simple clean design */}
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
