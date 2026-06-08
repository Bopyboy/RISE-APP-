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
const PREMIUM_COLORS: Record<MuscleLevel, { fill: string; glow: string; gradient: [string, string]; shadow: string }> = {
  untrained:    { fill: '#1e2028', glow: 'transparent',  gradient: ['#1e2028', '#252830'], shadow: '#00000020' },
  beginner:     { fill: '#dc2626', glow: '#dc2626',       gradient: ['#991b1b', '#f87171'], shadow: '#dc262633' },
  intermediate: { fill: '#ea7c18', glow: '#ea7c18',       gradient: ['#92400e', '#fbbf24'], shadow: '#ea7c1833' },
  advanced:     { fill: '#2563eb', glow: '#2563eb',       gradient: ['#1e40af', '#60a5fa'], shadow: '#2563eb33' },
  elite:        { fill: '#16a34a', glow: '#16a34a',       gradient: ['#15803d', '#4ade80'], shadow: '#16a34a33' },
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
    <g key={`group-${id}`}>
      {/* Shadow layer for depth */}
      <path
        d={d}
        fill={c.shadow}
        opacity="0.6"
        style={{
          transform: 'translate(1.5px, 1.5px)',
          filter: 'blur(1px)',
        }}
      />
      {/* Main muscle path */}
      <path
        d={d}
        fill={`url(#grad-${id})`}
        style={{
          filter: level !== 'untrained'
            ? `drop-shadow(0 0 8px ${c.glow}aa) drop-shadow(0 0 3px ${c.glow}ff)`
            : undefined,
          opacity: level === 'untrained' ? 0.5 : 1,
          transition: 'all 0.3s ease',
        }}
        className="cursor-pointer"
        onMouseEnter={e => onHover(name, level, e)}
        onMouseLeave={onLeave}
        onTouchStart={e => onHover(name, level, e)}
        onTouchEnd={onLeave}
      />
      {/* Highlight edge for definition */}
      {level !== 'untrained' && (
        <path
          d={d}
          fill="none"
          stroke={`${c.fill}44`}
          strokeWidth="0.6"
          opacity="0.5"
        />
      )}
    </g>
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

  // Front view muscles with improved anatomy
  const frontMuscles = [
    // --- HEAD & NECK ---
    { id: 'head', name: 'Head', level: muscleLevels.chest,
      d: 'M95 20 Q85 18 80 25 Q75 35 75 50 Q75 65 85 72 Q95 75 100 75 Q105 75 115 72 Q125 65 125 50 Q125 35 120 25 Q115 18 105 20 Q100 18 95 20 Z' },
    { id: 'neck', name: 'Neck', level: muscleLevels.shoulders,
      d: 'M92 73 Q88 80 88 90 L112 90 Q112 80 108 73 Q100 76 92 73 Z' },

    // --- CHEST (more detailed) ---
    { id: 'pec-left', name: 'Chest', level: muscleLevels.chest,
      d: 'M88 92 Q78 95 72 108 Q68 125 70 145 Q75 158 88 162 Q92 155 94 138 Q95 115 96 100 L88 92 Z' },
    { id: 'pec-right', name: 'Chest', level: muscleLevels.chest,
      d: 'M112 92 Q122 95 128 108 Q132 125 130 145 Q125 158 112 162 Q108 155 106 138 Q105 115 104 100 L112 92 Z' },

    // --- SHOULDERS (front deltoids) ---
    { id: 'delt-left', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M72 105 Q60 102 54 115 Q50 132 56 150 Q65 155 76 150 Q78 135 75 115 Z' },
    { id: 'delt-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M128 105 Q140 102 146 115 Q150 132 144 150 Q135 155 124 150 Q122 135 125 115 Z' },

    // --- UPPER CHEST / CLAVICLE ---
    { id: 'upper-chest', name: 'Chest', level: muscleLevels.chest,
      d: 'M85 92 L115 92 Q115 100 112 108 L100 110 L88 108 Q88 100 85 92 Z' },

    // --- BICEPS (front arms) ---
    { id: 'bicep-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M68 150 Q62 168 60 190 Q59 210 64 225 L76 220 Q78 198 78 175 Q77 160 72 150 Z' },
    { id: 'bicep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M132 150 Q138 168 140 190 Q141 210 136 225 L124 220 Q122 198 122 175 Q123 160 128 150 Z' },

    // --- FOREARMS ---
    { id: 'forearm-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M60 228 Q56 250 55 270 Q56 285 62 295 L72 290 Q73 268 72 245 Z' },
    { id: 'forearm-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M140 228 Q144 250 145 270 Q144 285 138 295 L128 290 Q127 268 128 245 Z' },

    // --- ABS (realistic 6-pack) ---
    { id: 'abs-upper-l', name: 'Core', level: muscleLevels.core,
      d: 'M92 165 Q95 168 100 168 Q102 165 102 158 Q100 155 95 156 Q92 157 92 165 Z' },
    { id: 'abs-upper-r', name: 'Core', level: muscleLevels.core,
      d: 'M98 158 Q100 155 105 156 Q108 157 108 165 Q105 168 100 168 Q98 165 98 158 Z' },
    
    { id: 'abs-mid-l', name: 'Core', level: muscleLevels.core,
      d: 'M92 175 Q95 178 100 178 Q102 175 102 168 Q100 165 95 166 Q92 167 92 175 Z' },
    { id: 'abs-mid-r', name: 'Core', level: muscleLevels.core,
      d: 'M98 168 Q100 165 105 166 Q108 167 108 175 Q105 178 100 178 Q98 175 98 168 Z' },
    
    { id: 'abs-lower-l', name: 'Core', level: muscleLevels.core,
      d: 'M92 186 Q95 189 100 189 Q102 186 102 178 Q100 175 95 176 Q92 177 92 186 Z' },
    { id: 'abs-lower-r', name: 'Core', level: muscleLevels.core,
      d: 'M98 178 Q100 175 105 176 Q108 177 108 186 Q105 189 100 189 Q98 186 98 178 Z' },

    // --- SERRATUS (side abs) ---
    { id: 'serratus-left', name: 'Core', level: muscleLevels.core,
      d: 'M70 148 Q68 165 70 185 Q75 200 85 208 L82 200 Q78 185 78 168 L72 150 Z' },
    { id: 'serratus-right', name: 'Core', level: muscleLevels.core,
      d: 'M130 148 Q132 165 130 185 Q125 200 115 208 L118 200 Q122 185 122 168 L128 150 Z' },

    // --- OBLIQUES (external) ---
    { id: 'oblique-left', name: 'Core', level: muscleLevels.core,
      d: 'M82 210 Q75 222 74 240 Q76 258 85 270 L95 262 Q92 245 93 228 L88 215 Z' },
    { id: 'oblique-right', name: 'Core', level: muscleLevels.core,
      d: 'M118 210 Q125 222 126 240 Q124 258 115 270 L105 262 Q108 245 107 228 L112 215 Z' },

    // --- RECTUS ABDOMINIS (lower) ---
    { id: 'lower-abs-l', name: 'Core', level: muscleLevels.core,
      d: 'M92 195 Q95 198 100 198 Q102 195 102 188 Q100 185 95 186 Q92 187 92 195 Z' },
    { id: 'lower-abs-r', name: 'Core', level: muscleLevels.core,
      d: 'M98 188 Q100 185 105 186 Q108 187 108 195 Q105 198 100 198 Q98 195 98 188 Z' },

    // --- QUADS (more realistic 4-part) ---
    { id: 'quad-vastus-medialis-l', name: 'Legs', level: muscleLevels.legs,
      d: 'M95 275 Q93 305 95 340 Q97 360 105 370 L108 365 Q107 335 107 305 L100 275 Z' },
    { id: 'quad-vastus-lateralis-l', name: 'Legs', level: muscleLevels.legs,
      d: 'M78 280 Q72 310 72 345 Q73 365 82 375 L92 368 Q88 340 88 310 L85 280 Z' },
    
    { id: 'quad-vastus-medialis-r', name: 'Legs', level: muscleLevels.legs,
      d: 'M105 275 Q107 305 105 340 Q103 360 95 370 L92 365 Q93 335 93 305 L100 275 Z' },
    { id: 'quad-vastus-lateralis-r', name: 'Legs', level: muscleLevels.legs,
      d: 'M122 280 Q128 310 128 345 Q127 365 118 375 L108 368 Q112 340 112 310 L115 280 Z' },

    // --- VMO (teardrop) ---
    { id: 'vmo-l', name: 'Legs', level: muscleLevels.legs,
      d: 'M100 330 Q102 345 100 360 Q99 365 96 368 Q98 360 100 345 L100 330 Z' },
    { id: 'vmo-r', name: 'Legs', level: muscleLevels.legs,
      d: 'M100 330 Q98 345 100 360 Q101 365 104 368 Q102 360 100 345 L100 330 Z' },

    // --- CALVES (front) ---
    { id: 'calf-medial-l', name: 'Legs', level: muscleLevels.legs,
      d: 'M82 375 Q78 395 78 420 Q80 445 90 455 L95 448 Q93 425 93 400 Z' },
    { id: 'calf-lateral-l', name: 'Legs', level: muscleLevels.legs,
      d: 'M72 378 Q68 400 70 425 Q72 448 82 458 L88 452 Q85 428 85 405 L78 380 Z' },
    
    { id: 'calf-medial-r', name: 'Legs', level: muscleLevels.legs,
      d: 'M118 375 Q122 395 122 420 Q120 445 110 455 L105 448 Q107 425 107 400 Z' },
    { id: 'calf-lateral-r', name: 'Legs', level: muscleLevels.legs,
      d: 'M128 378 Q132 400 130 425 Q128 448 118 458 L112 452 Q115 428 115 405 L122 380 Z' },

    // --- TIBIALIS (front shin) ---
    { id: 'tibialis-l', name: 'Legs', level: muscleLevels.legs,
      d: 'M85 378 Q84 405 85 435 Q86 452 90 460 L88 456 Q87 435 87 410 Z' },
    { id: 'tibialis-r', name: 'Legs', level: muscleLevels.legs,
      d: 'M115 378 Q116 405 115 435 Q114 452 110 460 L112 456 Q113 435 113 410 Z' },
  ]

  // Back view muscles with improved anatomy
  const backMuscles = [
    // --- HEAD ---
    { id: 'head-back', name: 'Head', level: muscleLevels.chest,
      d: 'M95 20 Q85 18 80 25 Q75 35 75 50 Q75 65 85 72 Q95 75 100 75 Q105 75 115 72 Q125 65 125 50 Q125 35 120 25 Q115 18 105 20 Q100 18 95 20 Z' },

    // --- TRAPS (upper back) ---
    { id: 'trap-left', name: 'Back', level: muscleLevels.back,
      d: 'M100 75 Q85 78 75 88 Q70 98 75 115 L92 108 Q98 95 100 82 Z' },
    { id: 'trap-right', name: 'Back', level: muscleLevels.back,
      d: 'M100 75 Q115 78 125 88 Q130 98 125 115 L108 108 Q102 95 100 82 Z' },

    // --- REAR DELTS ---
    { id: 'rear-delt-left', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M72 100 Q58 108 52 125 Q50 145 60 160 Q72 158 80 145 Q82 125 78 110 Z' },
    { id: 'rear-delt-right', name: 'Shoulders', level: muscleLevels.shoulders,
      d: 'M128 100 Q142 108 148 125 Q150 145 140 160 Q128 158 120 145 Q118 125 122 110 Z' },

    // --- LATS (upper & lower) ---
    { id: 'lat-upper-left', name: 'Back', level: muscleLevels.back,
      d: 'M78 115 Q68 135 70 160 Q74 185 85 200 L96 190 Q93 165 92 140 L85 120 Z' },
    { id: 'lat-upper-right', name: 'Back', level: muscleLevels.back,
      d: 'M122 115 Q132 135 130 160 Q126 185 115 200 L104 190 Q107 165 108 140 L115 120 Z' },

    { id: 'lat-lower-left', name: 'Back', level: muscleLevels.back,
      d: 'M70 205 Q65 230 70 255 Q78 275 90 280 L92 270 Q88 250 85 225 L75 210 Z' },
    { id: 'lat-lower-right', name: 'Back', level: muscleLevels.back,
      d: 'M130 205 Q135 230 130 255 Q122 275 110 280 L108 270 Q112 250 115 225 L125 210 Z' },

    // --- RHOMBOIDS (mid-back) ---
    { id: 'rhomboid-left', name: 'Back', level: muscleLevels.back,
      d: 'M92 115 L78 125 L82 165 L96 155 Z' },
    { id: 'rhomboid-right', name: 'Back', level: muscleLevels.back,
      d: 'M108 115 L122 125 L118 165 L104 155 Z' },

    // --- ERECTOR SPINAE (lower back) ---
    { id: 'erector-left', name: 'Back', level: muscleLevels.back,
      d: 'M94 160 Q92 185 92 210 Q92 230 96 248 L99 245 Q99 220 100 195 L99 165 Z' },
    { id: 'erector-right', name: 'Back', level: muscleLevels.back,
      d: 'M106 160 Q108 185 108 210 Q108 230 104 248 L101 245 Q101 220 100 195 L101 165 Z' },

    // --- TRICEPS (back arms) ---
    { id: 'tricep-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M60 120 Q52 145 52 175 Q54 205 62 225 L74 215 Q72 185 72 155 L68 125 Z' },
    { id: 'tricep-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M140 120 Q148 145 148 175 Q146 205 138 225 L126 215 Q128 185 128 155 L132 125 Z' },

    // --- FOREARMS (back) ---
    { id: 'back-forearm-left', name: 'Arms', level: muscleLevels.arms,
      d: 'M52 230 Q48 255 50 280 Q53 300 62 310 L72 302 Q70 280 70 255 Z' },
    { id: 'back-forearm-right', name: 'Arms', level: muscleLevels.arms,
      d: 'M148 230 Q152 255 150 280 Q147 300 138 310 L128 302 Q130 280 130 255 Z' },

    // --- GLUTES (buttocks) ---
    { id: 'glute-left', name: 'Legs', level: muscleLevels.legs,
      d: 'M80 255 Q70 270 72 290 L100 295 L100 260 Q90 255 80 255 Z' },
    { id: 'glute-right', name: 'Legs', level: muscleLevels.legs,
      d: 'M120 255 Q130 270 128 290 L100 295 L100 260 Q110 255 120 255 Z' },

    // --- HAMSTRINGS ---
    { id: 'ham-medial-l', name: 'Legs', level: muscleLevels.legs,
      d: 'M92 298 Q90 330 92 360 Q95 380 105 390 L102 385 Q100 360 100 330 Z' },
    { id: 'ham-lateral-l', name: 'Legs', level: muscleLevels.legs,
      d: 'M72 298 Q68 330 70 360 Q72 380 82 390 L85 382 Q82 360 82 330 Z' },
    
    { id: 'ham-medial-r', name: 'Legs', level: muscleLevels.legs,
      d: 'M108 298 Q110 330 108 360 Q105 380 95 390 L98 385 Q100 360 100 330 Z' },
    { id: 'ham-lateral-r', name: 'Legs', level: muscleLevels.legs,
      d: 'M128 298 Q132 330 130 360 Q128 380 118 390 L115 382 Q118 360 118 330 Z' },

    // --- CALVES (back) ---
    { id: 'calf-back-medial-l', name: 'Legs', level: muscleLevels.legs,
      d: 'M82 395 Q80 420 82 450 Q85 475 95 485 L100 478 Q98 450 98 425 Z' },
    { id: 'calf-back-lateral-l', name: 'Legs', level: muscleLevels.legs,
      d: 'M72 398 Q68 425 70 455 Q73 478 82 490 L88 483 Q85 460 85 435 L78 405 Z' },
    
    { id: 'calf-back-medial-r', name: 'Legs', level: muscleLevels.legs,
      d: 'M118 395 Q120 420 118 450 Q115 475 105 485 L100 478 Q102 450 102 425 Z' },
    { id: 'calf-back-lateral-r', name: 'Legs', level: muscleLevels.legs,
      d: 'M128 398 Q132 425 130 455 Q127 478 118 490 L112 483 Q115 460 115 435 L122 405 Z' },
  ]

  const muscles = view === 'front' ? frontMuscles : backMuscles

  // Build gradient defs for every muscle with better gradients
  const gradientDefs = muscles.map(m => {
    const c = PREMIUM_COLORS[m.level]
    return (
      <linearGradient key={`grad-${m.id}`} id={`grad-${m.id}`} x1="0%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={c.gradient[1]} stopOpacity="0.9" />
        <stop offset="50%" stopColor={c.gradient[1]} stopOpacity="1" />
        <stop offset="100%" stopColor={c.gradient[0]} stopOpacity="0.85" />
      </linearGradient>
    )
  })

  return (
    <div className="relative flex justify-center">
      <svg viewBox="0 0 200 500" className="h-[480px] w-auto drop-shadow-2xl">
        <defs>
          {gradientDefs}
          {/* Skin tone gradient for body outline */}
          <linearGradient id="skin-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8c9a8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#c9a882" stopOpacity="0.08" />
          </linearGradient>
          <filter id="bodyGlow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Body silhouette outline with subtle definition */}
        <g opacity="0.3">
          <path
            d={view === 'front' 
              ? 'M75 20 L80 25 L60 100 L54 150 L52 230 L60 280 L72 380 L78 460 L100 500 L122 460 L128 380 L140 280 L148 230 L146 150 L140 100 L120 25 L125 20 Q100 15 75 20 Z'
              : 'M75 20 L80 25 L60 100 L54 150 L52 230 L60 280 L72 380 L78 460 L100 500 L122 460 L128 380 L140 280 L148 230 L146 150 L140 100 L120 25 L125 20 Q100 15 75 20 Z'
            }
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        </g>

        {/* Muscle paths with shadows */}
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

        {/* Anatomical definition lines */}
        <g stroke="rgba(0,0,0,0.35)" strokeWidth="0.5" fill="none" opacity="0.6">
          {view === 'front' ? (
            <>
              {/* Sternum line */}
              <line x1="100" y1="92" x2="100" y2="210" />
              {/* Abs vertical separator */}
              <line x1="100" y1="158" x2="100" y2="196" />
              {/* Quad dividers */}
              <line x1="88" y1="275" x2="88" y2="370" opacity="0.5" />
              <line x1="112" y1="275" x2="112" y2="370" opacity="0.5" />
              {/* Pec separation */}
              <line x1="100" y1="105" x2="100" y2="160" />
            </>
          ) : (
            <>
              {/* Spine line */}
              <line x1="100" y1="75" x2="100" y2="250" />
              {/* Glute divider */}
              <line x1="100" y1="255" x2="100" y2="295" opacity="0.5" />
              {/* Hamstring divider */}
              <line x1="100" y1="298" x2="100" y2="390" opacity="0.4" />
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
              background: 'rgba(10,12,18,0.95)',
              border: `1px solid ${PREMIUM_COLORS[tooltip.level].fill}77`,
              boxShadow: `0 0 20px ${PREMIUM_COLORS[tooltip.level].glow}55, inset 0 0 8px ${PREMIUM_COLORS[tooltip.level].glow}22`,
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
