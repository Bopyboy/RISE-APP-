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

const PREMIUM_COLORS: Record<MuscleLevel, { fill: string; glow: string }> = {
  untrained:    { fill: '#1e2028', glow: 'transparent' },
  beginner:     { fill: '#dc2626', glow: '#dc2626' },
  intermediate: { fill: '#ea7c18', glow: '#ea7c18' },
  advanced:     { fill: '#2563eb', glow: '#2563eb' },
  elite:        { fill: '#16a34a', glow: '#16a34a' },
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
      fill={c.fill}
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="0.5"
      style={{
        filter: level !== 'untrained'
          ? `drop-shadow(0 0 6px ${c.glow})`
          : undefined,
        opacity: level === 'untrained' ? 0.6 : 1,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
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
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()
    setTooltip({
      name, level,
      cx: rect.left + rect.width / 2 - containerRect.left,
      cy: rect.top - containerRect.top,
    })
  }

  // Properly proportioned muscle paths based on anatomical reference
  const frontMuscles = [
    // Head
    { id: 'head', name: 'Head', level: muscleLevels.chest,
      d: 'M50 8 Q60 5 70 8 Q75 12 75 22 Q75 32 60 38 Q45 32 45 22 Q45 12 50 8 Z' },

    // Neck
    { id: 'neck', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M55 38 L50 48 L70 48 L65 38 Z' },

    // Shoulders/Deltoids
    { id: 'shoulder-left', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M50 48 Q40 50 35 60 Q36 70 45 73 L50 58 Z' },
    { id: 'shoulder-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M70 48 Q80 50 85 60 Q84 70 75 73 L70 58 Z' },

    // Chest
    { id: 'chest', name: 'Chest', level: muscleLevels.chest,
      d: 'M50 50 Q48 58 48 70 Q50 85 60 92 Q70 85 72 70 Q72 58 70 50 Z' },

    // Abs/Core
    { id: 'abs', name: 'Core', level: muscleLevels.core,
      d: 'M57 92 Q60 90 63 92 L63 120 Q60 125 57 120 Z' },

    // Biceps Left
    { id: 'bicep-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M35 73 Q25 78 22 95 Q24 110 35 115 L45 100 L48 75 Z' },

    // Biceps Right
    { id: 'bicep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M85 73 Q95 78 98 95 Q96 110 85 115 L75 100 L72 75 Z' },

    // Forearm Left
    { id: 'forearm-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M22 118 Q18 135 18 150 Q20 160 32 162 L38 150 Z' },

    // Forearm Right
    { id: 'forearm-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M98 118 Q102 135 102 150 Q100 160 88 162 L82 150 Z' },

    // Quads Left
    { id: 'quad-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M54 125 Q52 140 52 165 Q53 195 58 215 Q62 218 65 215 Q66 195 66 165 Q66 140 66 125 Z' },

    // Quads Right
    { id: 'quad-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M66 125 Q68 140 68 165 Q67 195 62 215 Q58 218 55 215 Q54 195 54 165 Q54 140 54 125 Z' },

    // Calf Left
    { id: 'calf-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M56 218 Q54 235 54 250 Q56 265 60 270 L62 250 Q62 235 62 218 Z' },

    // Calf Right
    { id: 'calf-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M64 218 Q66 235 66 250 Q64 265 60 270 L58 250 Q58 235 58 218 Z' },
  ]

  const backMuscles = [
    // Head
    { id: 'head-back', name: 'Head', level: muscleLevels.chest,
      d: 'M50 8 Q60 5 70 8 Q75 12 75 22 Q75 32 60 38 Q45 32 45 22 Q45 12 50 8 Z' },

    // Neck
    { id: 'neck-back', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M55 38 L50 48 L70 48 L65 38 Z' },

    // Trapezius
    { id: 'trap', name: 'Back', level: muscleLevels.back,
      d: 'M50 48 L42 62 Q40 72 42 82 L60 65 L78 82 Q80 72 78 62 L70 48 Z' },

    // Rear Deltoids Left
    { id: 'rear-delt-left', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M42 65 Q32 70 28 85 Q30 98 42 103 L48 85 Z' },

    // Rear Deltoids Right
    { id: 'rear-delt-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M78 65 Q88 70 92 85 Q90 98 78 103 L72 85 Z' },

    // Lats Left
    { id: 'lat-left', name: 'Back', level: muscleLevels.back,
      d: 'M42 85 Q30 100 28 120 Q32 145 45 160 L54 145 L56 100 Z' },

    // Lats Right
    { id: 'lat-right', name: 'Back', level: muscleLevels.back,
      d: 'M78 85 Q90 100 92 120 Q88 145 75 160 L66 145 L64 100 Z' },

    // Upper Back
    { id: 'upper-back', name: 'Back', level: muscleLevels.back,
      d: 'M56 65 L64 65 L64 100 L56 100 Z' },

    // Lower Back/Erectors
    { id: 'lower-back', name: 'Back', level: muscleLevels.back,
      d: 'M57 102 L63 102 L63 125 L57 125 Z' },

    // Triceps Left
    { id: 'tricep-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M28 105 Q16 115 14 135 Q18 155 32 162 L42 140 Z' },

    // Triceps Right
    { id: 'tricep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M92 105 Q104 115 106 135 Q102 155 88 162 L78 140 Z' },

    // Forearm Left (back)
    { id: 'forearm-left-back', name: 'Arms', level: muscleLevels.arms,
      d: 'M14 165 Q10 180 12 195 Q20 208 32 212 L38 195 Z' },

    // Forearm Right (back)
    { id: 'forearm-right-back', name: 'Arms', level: muscleLevels.arms,
      d: 'M106 165 Q110 180 108 195 Q100 208 88 212 L82 195 Z' },

    // Glutes Left
    { id: 'glute-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M54 128 Q50 140 50 155 Q54 168 60 172 L60 145 Z' },

    // Glutes Right
    { id: 'glute-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M66 128 Q70 140 70 155 Q66 168 60 172 L60 145 Z' },

    // Hamstrings Left
    { id: 'ham-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M54 173 Q52 193 53 218 Q57 240 60 250 L60 220 Z' },

    // Hamstrings Right
    { id: 'ham-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M66 173 Q68 193 67 218 Q63 240 60 250 L60 220 Z' },

    // Calf Left (back)
    { id: 'calf-left-back', name: 'Legs', level: muscleLevels.legs,
      d: 'M57 252 Q55 268 55 280 Q57 292 62 296 L62 278 Z' },

    // Calf Right (back)
    { id: 'calf-right-back', name: 'Legs', level: muscleLevels.legs,
      d: 'M63 252 Q65 268 65 280 Q63 292 58 296 L58 278 Z' },
  ]

  const muscles = view === 'front' ? frontMuscles : backMuscles

  return (
    <div className="relative flex justify-center">
      <svg viewBox="0 0 120 300" className="h-[420px] w-auto drop-shadow-lg">
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
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: tooltip.cx, top: tooltip.cy - 8, transform: 'translate(-50%, -100%)' }}
        >
          <div
            className="rounded-lg px-3 py-1.5 shadow-lg backdrop-blur-sm"
            style={{
              background: 'rgba(15,18,25,0.9)',
              border: `1px solid ${PREMIUM_COLORS[tooltip.level].fill}88`,
              boxShadow: `0 0 12px ${PREMIUM_COLORS[tooltip.level].glow}44`,
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
        <div className="px-4 pb-4 flex justify-center">
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
                  ? `rgba(${PREMIUM_COLORS[tab.level].fill}, 0.2)`
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
