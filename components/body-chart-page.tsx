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

// Premium color palette per level — richer, more saturated
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

  // All muscle paths: more detailed shapes matching the reference image
  const frontMuscles = [
    // --- CHEST ---
    { id: 'pec-left',   name: 'Chest',     level: muscleLevels.chest,
      d: 'M100 105 Q88 102 80 108 Q72 116 72 130 Q73 142 82 148 Q94 150 100 145 Z' },
    { id: 'pec-right',  name: 'Chest',     level: muscleLevels.chest,
      d: 'M100 105 Q112 102 120 108 Q128 116 128 130 Q127 142 118 148 Q106 150 100 145 Z' },

    // --- SHOULDERS ---
    { id: 'delt-left',  name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M80 95 Q70 92 64 98 Q58 105 60 118 Q62 128 70 133 L78 128 Q76 116 78 106 Z' },
    { id: 'delt-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M120 95 Q130 92 136 98 Q142 105 140 118 Q138 128 130 133 L122 128 Q124 116 122 106 Z' },

    // --- BICEPS ---
    { id: 'bicep-left',  name: 'Arms', level: muscleLevels.arms,
      d: 'M60 120 Q54 132 52 150 Q51 162 56 172 L64 170 Q68 156 68 138 L66 122 Z' },
    { id: 'bicep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M140 120 Q146 132 148 150 Q149 162 144 172 L136 170 Q132 156 132 138 L134 122 Z' },

    // --- FOREARMS ---
    { id: 'forearm-left',  name: 'Arms', level: muscleLevels.arms,
      d: 'M53 174 Q48 192 47 212 Q48 222 54 226 L62 222 Q63 200 62 178 Z' },
    { id: 'forearm-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M147 174 Q152 192 153 212 Q152 222 146 226 L138 222 Q137 200 138 178 Z' },

    // --- ABS (6-pack grid) ---
    { id: 'abs-top-l',    name: 'Core', level: muscleLevels.core, d: 'M94 150 L100 150 L100 163 L94 163 Q92 157 94 150Z' },
    { id: 'abs-top-r',    name: 'Core', level: muscleLevels.core, d: 'M100 150 L106 150 Q108 157 106 163 L100 163 Z' },
    { id: 'abs-mid-l',    name: 'Core', level: muscleLevels.core, d: 'M94 165 L100 165 L100 178 L94 178 Q92 171 94 165Z' },
    { id: 'abs-mid-r',    name: 'Core', level: muscleLevels.core, d: 'M100 165 L106 165 Q108 171 106 178 L100 178 Z' },
    { id: 'abs-low-l',    name: 'Core', level: muscleLevels.core, d: 'M94 180 L100 180 L100 193 L94 193 Q93 187 94 180Z' },
    { id: 'abs-low-r',    name: 'Core', level: muscleLevels.core, d: 'M100 180 L106 180 Q107 187 106 193 L100 193 Z' },

    // --- OBLIQUES ---
    { id: 'oblique-left',  name: 'Core', level: muscleLevels.core,
      d: 'M82 148 Q78 158 76 178 Q75 192 80 200 L90 196 Q90 174 90 156 L86 148 Z' },
    { id: 'oblique-right', name: 'Core', level: muscleLevels.core,
      d: 'M118 148 Q122 158 124 178 Q125 192 120 200 L110 196 Q110 174 110 156 L114 148 Z' },

    // --- HIP FLEXORS / LOWER ABS ---
    { id: 'hip-left',  name: 'Core', level: muscleLevels.core,
      d: 'M88 195 Q82 202 80 212 L95 212 L96 198 Z' },
    { id: 'hip-right', name: 'Core', level: muscleLevels.core,
      d: 'M112 195 Q118 202 120 212 L105 212 L104 198 Z' },

    // --- QUADS ---
    { id: 'quad-left-inner',  name: 'Legs', level: muscleLevels.legs,
      d: 'M95 215 Q90 240 90 270 Q91 285 96 290 L104 288 L104 214 Z' },
    { id: 'quad-left-outer',  name: 'Legs', level: muscleLevels.legs,
      d: 'M82 215 Q76 240 74 272 Q74 286 82 292 L95 290 Q90 265 90 240 L90 215 Z' },
    { id: 'quad-right-inner', name: 'Legs', level: muscleLevels.legs,
      d: 'M105 215 L104 288 L110 290 Q114 285 114 270 Q114 245 110 215 Z' },
    { id: 'quad-right-outer', name: 'Legs', level: muscleLevels.legs,
      d: 'M118 215 Q124 240 126 272 Q126 286 118 292 L105 290 Q110 265 110 240 L110 215 Z' },

    // --- CALVES (front) ---
    { id: 'calf-front-left',  name: 'Legs', level: muscleLevels.legs,
      d: 'M78 295 Q74 316 74 342 Q75 358 82 364 L90 360 Q92 332 90 304 Z' },
    { id: 'calf-front-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M122 295 Q126 316 126 342 Q125 358 118 364 L110 360 Q108 332 110 304 Z' },
  ]

  const backMuscles = [
    // --- TRAPS ---
    { id: 'trap-left',  name: 'Back', level: muscleLevels.back,
      d: 'M100 80 Q90 80 82 86 Q76 92 78 102 L90 100 Q95 90 100 85 Z' },
    { id: 'trap-right', name: 'Back', level: muscleLevels.back,
      d: 'M100 80 Q110 80 118 86 Q124 92 122 102 L110 100 Q105 90 100 85 Z' },

    // --- REAR DELTS ---
    { id: 'rear-delt-left',  name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M64 97 Q57 103 56 116 Q57 126 64 131 L72 126 Q70 112 72 104 Z' },
    { id: 'rear-delt-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M136 97 Q143 103 144 116 Q143 126 136 131 L128 126 Q130 112 128 104 Z' },

    // --- LATS ---
    { id: 'lat-left',  name: 'Back', level: muscleLevels.back,
      d: 'M72 128 Q66 148 68 168 Q70 185 78 194 L92 190 Q92 166 90 140 L80 128 Z' },
    { id: 'lat-right', name: 'Back', level: muscleLevels.back,
      d: 'M128 128 Q134 148 132 168 Q130 185 122 194 L108 190 Q108 166 110 140 L120 128 Z' },

    // --- MID BACK (rhomboids / mid traps) ---
    { id: 'mid-back', name: 'Back', level: muscleLevels.back,
      d: 'M88 100 L112 100 L114 145 L86 145 Z' },

    // --- LOWER BACK / ERECTORS ---
    { id: 'erector-left',  name: 'Back', level: muscleLevels.back,
      d: 'M90 147 L98 147 L98 192 L88 198 Q86 172 88 148 Z' },
    { id: 'erector-right', name: 'Back', level: muscleLevels.back,
      d: 'M102 147 L112 147 Q114 172 112 198 L102 192 Z' },

    // --- TRICEPS ---
    { id: 'tricep-left',  name: 'Arms', level: muscleLevels.arms,
      d: 'M56 118 Q50 132 50 154 Q51 168 57 174 L65 170 Q68 150 66 130 L62 118 Z' },
    { id: 'tricep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M144 118 Q150 132 150 154 Q149 168 143 174 L135 170 Q132 150 134 130 L138 118 Z' },

    // --- FOREARMS (back) ---
    { id: 'back-forearm-left',  name: 'Arms', level: muscleLevels.arms,
      d: 'M53 176 Q48 196 47 216 Q48 224 54 228 L62 224 Q62 202 62 180 Z' },
    { id: 'back-forearm-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M147 176 Q152 196 153 216 Q152 224 146 228 L138 224 Q138 202 138 180 Z' },

    // --- GLUTES ---
    { id: 'glute-left',  name: 'Legs', level: muscleLevels.legs,
      d: 'M80 200 Q72 212 72 228 L100 232 L100 200 Q92 196 80 200 Z' },
    { id: 'glute-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M120 200 Q128 212 128 228 L100 232 L100 200 Q108 196 120 200 Z' },

    // --- HAMSTRINGS ---
    { id: 'ham-left',  name: 'Legs', level: muscleLevels.legs,
      d: 'M74 234 Q70 260 72 290 L92 290 Q94 262 90 236 Z' },
    { id: 'ham-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M126 234 Q130 260 128 290 L108 290 Q106 262 110 236 Z' },

    // --- CALVES (back) ---
    { id: 'calf-back-left',  name: 'Legs', level: muscleLevels.legs,
      d: 'M74 296 Q70 320 70 348 Q72 362 80 368 L90 364 Q92 332 90 305 Z' },
    { id: 'calf-back-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M126 296 Q130 320 130 348 Q128 362 120 368 L110 364 Q108 332 110 305 Z' },
  ]

  const muscles = view === 'front' ? frontMuscles : backMuscles

  // Build gradient defs for every muscle
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
      <svg viewBox="0 0 200 400" className="h-[380px] w-auto drop-shadow-2xl">
        <defs>
          {gradientDefs}
          {/* Skin tone gradient for body outline */}
          <linearGradient id="skin-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8c9a8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#c9a882" stopOpacity="0.10" />
          </linearGradient>
          <filter id="bodyGlow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Body silhouette */}
        <g>
          {/* Head */}
          <ellipse cx="100" cy="42" rx="22" ry="26" fill="url(#skin-grad)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
          {/* Neck */}
          <rect x="93" y="66" width="14" height="14" rx="3" fill="url(#skin-grad)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          {/* Torso + arms + legs base silhouette */}
          <path
            d="M66 80 Q56 86 55 106 Q54 120 50 172 Q46 212 46 224 L54 228 L62 224 Q64 200 65 172 L76 202 Q70 262 70 292 Q68 352 70 372 L90 376 L90 292 L100 282 L110 292 L110 376 L130 372 Q132 352 130 292 Q130 262 124 202 L135 172 Q136 200 138 224 L146 228 L154 224 Q154 212 150 172 Q146 120 145 106 Q144 86 134 80 Q116 75 100 75 Q84 75 66 80Z"
            fill="url(#skin-grad)"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="0.8"
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

        {/* Subtle muscle definition lines — always visible */}
        <g stroke="rgba(0,0,0,0.25)" strokeWidth="0.4" fill="none">
          {view === 'front' ? (
            <>
              {/* Sternum line */}
              <line x1="100" y1="104" x2="100" y2="195" />
              {/* Abs horizontal separators */}
              <line x1="93" y1="163" x2="107" y2="163" />
              <line x1="93" y1="178" x2="107" y2="178" />
              {/* Quad dividers */}
              <line x1="90" y1="214" x2="90" y2="292" opacity="0.6" />
              <line x1="110" y1="214" x2="110" y2="292" opacity="0.6" />
            </>
          ) : (
            <>
              {/* Spine line */}
              <line x1="100" y1="80" x2="100" y2="200" />
              {/* Glute divider */}
              <line x1="100" y1="200" x2="100" y2="232" opacity="0.6" />
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
  // Raw weights entered by user (before e1RM conversion), keyed by exerciseId
  const [rawWeights, setRawWeights] = useState<Record<string, number>>({})
  // Reps entered by user for each exercise (default 1 = treat as 1RM)
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