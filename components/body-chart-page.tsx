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
      style={{
        filter: level !== 'untrained'
          ? `drop-shadow(0 0 10px ${c.glow}) drop-shadow(0 0 5px ${c.glow})`
          : `drop-shadow(0 0 2px ${c.glow})`,
        opacity: level === 'untrained' ? 0.55 : 1,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
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
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()
    setTooltip({
      name, level,
      cx: rect.left + rect.width / 2 - containerRect.left,
      cy: rect.top - containerRect.top,
    })
  }

  // FRONT VIEW - Properly connected body
  const frontMuscles = [
    // HEAD - sits on shoulders
    { id: 'head', name: 'Head', level: muscleLevels.chest,
      d: 'M85 20 Q100 15 115 20 Q125 30 125 45 Q125 60 100 68 Q75 60 75 45 Q75 30 85 20 Z' },

    // TRAPEZIUS (connects shoulders to neck)
    { id: 'trap-left', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M85 68 L75 90 Q70 100 72 110 L90 95 Z' },
    { id: 'trap-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M115 68 L125 90 Q130 100 128 110 L110 95 Z' },

    // SHOULDERS (large rounded caps on torso)
    { id: 'shoulder-left', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M65 88 Q55 92 50 105 Q52 120 68 125 L75 110 Z' },
    { id: 'shoulder-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M135 88 Q145 92 150 105 Q148 120 132 125 L125 110 Z' },

    // CHEST (large pectoral area - upper torso)
    { id: 'chest', name: 'Chest', level: muscleLevels.chest,
      d: 'M78 95 Q78 100 80 115 Q82 130 90 140 Q100 145 110 140 Q118 130 120 115 Q122 100 122 95 L100 88 Z' },

    // CORE/ABS (central vertical strip - lower torso)
    { id: 'abs', name: 'Core', level: muscleLevels.core,
      d: 'M92 142 Q100 140 108 142 L108 180 Q100 185 92 180 Z' },

    // BICEPS/UPPER ARM LEFT
    { id: 'bicep-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M50 125 Q40 130 38 155 Q40 175 55 182 L68 160 L72 130 Z' },
    // BICEPS/UPPER ARM RIGHT
    { id: 'bicep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M150 125 Q160 130 162 155 Q160 175 145 182 L132 160 L128 130 Z' },

    // FOREARM LEFT
    { id: 'forearm-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M38 185 Q32 200 32 220 Q35 235 50 240 L58 218 Z' },
    // FOREARM RIGHT
    { id: 'forearm-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M162 185 Q168 200 168 220 Q165 235 150 240 L142 218 Z' },

    // QUADRICEPS LEFT (upper leg - large)
    { id: 'quad-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M88 185 Q85 200 84 225 Q85 260 92 285 Q98 288 102 285 Q108 260 108 225 Q108 200 108 185 Z' },
    // QUADRICEPS RIGHT (upper leg - large)
    { id: 'quad-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M112 185 Q115 200 116 225 Q115 260 108 285 Q102 288 98 285 Q92 260 92 225 Q92 200 92 185 Z' },

    // CALF LEFT (lower leg)
    { id: 'calf-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M90 290 Q88 310 88 330 Q90 350 100 360 L102 330 Q102 310 102 290 Z' },
    // CALF RIGHT (lower leg)
    { id: 'calf-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M110 290 Q112 310 112 330 Q110 350 100 360 L98 330 Q98 310 98 290 Z' },
  ]

  // BACK VIEW - Properly connected
  const backMuscles = [
    // HEAD
    { id: 'head-back', name: 'Head', level: muscleLevels.chest,
      d: 'M85 20 Q100 15 115 20 Q125 30 125 45 Q125 60 100 68 Q75 60 75 45 Q75 30 85 20 Z' },

    // TRAPEZIUS (large upper back)
    { id: 'trap', name: 'Back', level: muscleLevels.back,
      d: 'M85 68 L75 90 Q70 105 72 125 L100 95 L128 125 Q130 105 125 90 L115 68 Z' },

    // SHOULDERS/REAR DELTS
    { id: 'shoulder-left-back', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M68 100 Q55 105 50 125 Q52 145 70 155 L78 130 Z' },
    { id: 'shoulder-right-back', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M132 100 Q145 105 150 125 Q148 145 130 155 L122 130 Z' },

    // LATS (large side back muscles)
    { id: 'lat-left', name: 'Back', level: muscleLevels.back,
      d: 'M72 128 Q60 145 58 170 Q62 200 80 220 L92 200 L95 145 Z' },
    { id: 'lat-right', name: 'Back', level: muscleLevels.back,
      d: 'M128 128 Q140 145 142 170 Q138 200 120 220 L108 200 L105 145 Z' },

    // CENTER BACK (rhomboids/upper back)
    { id: 'back-center', name: 'Back', level: muscleLevels.back,
      d: 'M90 95 L110 95 L112 145 L88 145 Z' },

    // LOWER BACK (erectors)
    { id: 'lower-back', name: 'Back', level: muscleLevels.back,
      d: 'M92 148 L108 148 L108 185 L92 185 Z' },

    // TRICEPS (back of arms)
    { id: 'tricep-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M50 160 Q38 170 36 195 Q40 220 58 228 L68 200 Z' },
    { id: 'tricep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M150 160 Q162 170 164 195 Q160 220 142 228 L132 200 Z' },

    // FOREARMS - back
    { id: 'back-forearm-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M36 232 Q30 250 32 270 Q40 285 55 290 L62 268 Z' },
    { id: 'back-forearm-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M164 232 Q170 250 168 270 Q160 285 145 290 L138 268 Z' },

    // GLUTES (butt - two round shapes)
    { id: 'glute-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M85 188 Q78 200 78 220 Q82 235 100 240 L100 215 Z' },
    { id: 'glute-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M115 188 Q122 200 122 220 Q118 235 100 240 L100 215 Z' },

    // HAMSTRINGS LEFT
    { id: 'ham-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M88 242 Q85 265 86 290 Q90 315 100 325 L100 290 Z' },
    // HAMSTRINGS RIGHT
    { id: 'ham-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M112 242 Q115 265 114 290 Q110 315 100 325 L100 290 Z' },

    // CALF - back LEFT
    { id: 'calf-back-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M95 328 Q92 345 92 365 Q95 380 102 385 L102 360 Z' },
    // CALF - back RIGHT
    { id: 'calf-back-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M105 328 Q108 345 108 365 Q105 380 98 385 L98 360 Z' },
  ]

  const muscles = view === 'front' ? frontMuscles : backMuscles

  return (
    <div className="relative flex justify-center">
      <svg viewBox="0 0 200 390" className="h-[380px] w-auto drop-shadow-2xl">
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
