'use client'

// components/exercise-guide-modal.tsx
// Replaces the YouTube link with a consistent-style exercise demo GIF.
// GIFs are sourced from ExerciseDB (https://exercisedb.dev) — all 1500
// exercises share the same 3D-character art style so they look matched.
// Attribution to AscendAPI is required per their free tier.

import { useState } from 'react'
import { X, ChevronDown, ChevronUp, Zap, AlertTriangle, Wind, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getExerciseGuide } from '@/lib/exercise-guides'

interface Props {
  exerciseName: string
  open: boolean
  onClose: () => void
}

const DIFFICULTY_COLORS = {
  Beginner: 'text-green-400 bg-green-400/10 border-green-400/20',
  Intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Advanced: 'text-red-400 bg-red-400/10 border-red-400/20',
}

// Exercise name (as it appears in exercise-guides.ts) -> ExerciseDB GIF URL.
// Add more here as you expand exercise-guides.ts. Keys are case-insensitive.
const EXERCISE_GIFS: Record<string, string> = {
  'bench press':        'https://static.exercisedb.dev/media/EIeI8Vf.gif',
  'squat':              'https://static.exercisedb.dev/media/qXTaZnJ.gif',
  'deadlift':           'https://static.exercisedb.dev/media/ila4NZS.gif',
  'overhead press':     'https://static.exercisedb.dev/media/Kyd9Rz5.gif',
  'pull-ups':           'https://static.exercisedb.dev/media/lBDjFxJ.gif',
  'pull ups':           'https://static.exercisedb.dev/media/lBDjFxJ.gif',
  'barbell curl':       'https://static.exercisedb.dev/media/25GPyDY.gif',
  'lateral raises':     'https://static.exercisedb.dev/media/DsgkuIt.gif',
  'tricep pushdowns':   'https://static.exercisedb.dev/media/3ZflifB.gif',
  'plank':              'https://static.exercisedb.dev/media/VBAWRPG.gif',
  'romanian deadlift':  'https://static.exercisedb.dev/media/wQ2c4XD.gif',
}

function gifFor(name: string): string | undefined {
  const key = name.toLowerCase().trim()
  return EXERCISE_GIFS[key]
}

function ExerciseAnimation({ name }: { name: string }) {
  const url = gifFor(name)
  const [failed, setFailed] = useState(false)

  if (!url || failed) {
    return (
      <div className="rounded-2xl border border-border bg-secondary/30 aspect-video flex items-center justify-center">
        <p className="text-xs text-muted-foreground">No demo available</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-white aspect-video relative">
      <img
        src={url}
        alt={`${name} demonstration`}
        onError={() => setFailed(true)}
        className="w-full h-full object-contain"
      />
      <span className="absolute bottom-1.5 right-2 text-[9px] text-black/40 font-medium">
        via ExerciseDB
      </span>
    </div>
  )
}

export function ExerciseGuideModal({ exerciseName, open, onClose }: Props) {
  const [expandedSection, setExpandedSection] = useState<string | null>('cues')
  const guide = getExerciseGuide(exerciseName)

  if (!open) return null

  const toggle = (section: string) =>
    setExpandedSection(prev => (prev === section ? null : section))

  const Section = ({
    id,
    icon: Icon,
    title,
    color,
    children,
  }: {
    id: string
    icon: any
    title: string
    color: string
    children: React.ReactNode
  }) => (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => toggle(id)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', color)} />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {expandedSection === id ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expandedSection === id && (
        <div className="px-4 pb-4 border-t border-border">{children}</div>
      )}
    </div>
  )

  if (!guide) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-6">
        <div className="w-full max-w-lg rounded-3xl bg-background border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">{exerciseName}</h2>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-secondary">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <ExerciseAnimation name={exerciseName} />
          <p className="text-sm text-muted-foreground mt-4">
            No detailed guide yet for this exercise.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-6">
      <div className="w-full max-w-lg rounded-3xl bg-background border border-border overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold text-foreground">{guide.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{guide.equipment}</p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-full p-2 hover:bg-secondary"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                DIFFICULTY_COLORS[guide.difficulty]
              )}
            >
              {guide.difficulty}
            </span>
            {guide.primaryMuscles.map(m => (
              <span
                key={m}
                className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {m}
              </span>
            ))}
            {guide.secondaryMuscles.slice(0, 2).map(m => (
              <span
                key={m}
                className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs text-muted-foreground/60"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Scrollable */}
        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-3">
          {/* Demo animation (replaces YouTube link) */}
          <ExerciseAnimation name={guide.name} />

          <Section id="cues" icon={Zap} title="Form Cues" color="text-primary">
            <ul className="mt-3 space-y-2">
              {guide.formCues.map((cue, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground leading-relaxed">{cue}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="mistakes" icon={AlertTriangle} title="Common Mistakes" color="text-red-400">
            <ul className="mt-3 space-y-2">
              {guide.commonMistakes.map((mistake, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400" />
                  <p className="text-sm text-foreground leading-relaxed">{mistake}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="breathing" icon={Wind} title="Breathing" color="text-blue-400">
            <p className="mt-3 text-sm text-foreground leading-relaxed">{guide.breathingTip}</p>
          </Section>

          <Section id="protip" icon={Star} title="Pro Tip" color="text-yellow-400">
            <p className="mt-3 text-sm text-foreground leading-relaxed">{guide.proTip}</p>
          </Section>
        </div>
      </div>
    </div>
  )
}
