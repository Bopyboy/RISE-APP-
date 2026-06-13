'use client'

import { useEffect, useState } from 'react'
import { X, ChevronDown, ChevronUp, Zap, AlertTriangle, Wind, Star, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getExerciseGuide } from '@/lib/exercise-guides'
import { getExerciseImageUrl } from '@/lib/exercise-media'

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

/**
 * Animated exercise demonstration.
 *
 * The free-exercise-db ships every movement with two reference frames:
 *   /0.jpg  → start position
 *   /1.jpg  → end position
 *
 * We crossfade between them on a loop, which gives a true motion preview
 * for EVERY exercise without needing a hand-authored gif/video per move.
 *
 * Speed is tuned per movement type (compound lifts slower, cardio faster).
 */
function ExerciseAnimation({ name }: { name: string }) {
  const baseUrl = getExerciseImageUrl(name)
  const [failed0, setFailed0] = useState(false)
  const [failed1, setFailed1] = useState(false)
  const [frame, setFrame] = useState<0 | 1>(0)
  const [playing, setPlaying] = useState(true)

  // Pick a tempo per movement family.
  const lower = name.toLowerCase()
  const tempoMs = (() => {
    if (/(jump rope|mountain climbers|hiit|battle ropes|sprint|cycling|treadmill|rowing|elliptical|stair)/.test(lower)) return 380
    if (/(curl|raise|fly|pushdown|extension|shrug|calf|crunch|twist|plank|dead bug)/.test(lower)) return 750
    if (/(deadlift|squat|bench|press|row|pull-up|pullup|chin)/.test(lower)) return 950
    return 850
  })()

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setFrame(prev => (prev === 0 ? 1 : 0))
    }, tempoMs)
    return () => window.clearInterval(id)
  }, [playing, tempoMs])

  if (!baseUrl) {
    return (
      <div className="rounded-2xl border border-border bg-secondary/30 aspect-video flex items-center justify-center">
        <p className="text-xs text-muted-foreground">No exercise animation available</p>
      </div>
    )
  }

  const url0 = baseUrl
  const url1 = baseUrl.replace(/\/0\.jpg(\?.*)?$/, '/1.jpg$1')

  // If both frames fail, show fallback.
  if (failed0 && failed1) {
    return (
      <div className="rounded-2xl border border-border bg-secondary/30 aspect-video flex items-center justify-center">
        <p className="text-xs text-muted-foreground">No exercise animation available</p>
      </div>
    )
  }

  // If frame 1 failed but frame 0 still loads, fall back to a static preview
  // so we never show a broken/blank image while "animating".
  const onlyHasFrame0 = failed1 && !failed0

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card aspect-video relative group">
      {/* Frame 0 */}
      <img
        src={url0}
        alt={`${name} — start position`}
        onError={() => setFailed0(true)}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out will-change-[opacity]',
          onlyHasFrame0 ? 'opacity-100' : frame === 0 ? 'opacity-100' : 'opacity-0',
        )}
        draggable={false}
      />
      {/* Frame 1 */}
      {!onlyHasFrame0 && (
        <img
          src={url1}
          alt={`${name} — end position`}
          onError={() => setFailed1(true)}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out will-change-[opacity]',
            frame === 1 ? 'opacity-100' : 'opacity-0',
          )}
          draggable={false}
        />
      )}

      {/* Subtle motion overlay so it always feels alive */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent',
        )}
      />

      {/* Phase indicator */}
      {!onlyHasFrame0 && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur px-2 py-0.5">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors',
              frame === 0 ? 'bg-primary' : 'bg-white/30',
            )}
          />
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors',
              frame === 1 ? 'bg-primary' : 'bg-white/30',
            )}
          />
          <span className="text-[10px] font-semibold text-white/90 ml-0.5">
            {frame === 0 ? 'START' : 'END'}
          </span>
        </div>
      )}

      {/* Play/pause */}
      {!onlyHasFrame0 && (
        <button
          type="button"
          onClick={() => setPlaying(p => !p)}
          aria-label={playing ? 'Pause animation' : 'Play animation'}
          className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-white/90 text-[10px] font-semibold hover:bg-black/70 transition-colors"
        >
          {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {playing ? 'Pause' : 'Play'}
        </button>
      )}

      <span className="absolute bottom-1.5 left-2 text-[9px] text-white/60 font-medium">
        animated reference
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
    id, icon: Icon, title, color, children,
  }: { id: string; icon: any; title: string; color: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={() => toggle(id)} className="flex w-full items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', color)} />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        {expandedSection === id
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
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
          <p className="text-sm text-muted-foreground mt-4">No detailed guide yet for this exercise.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-6">
      <div className="w-full max-w-lg rounded-3xl bg-background border border-border overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-5 pt-5 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold text-foreground">{guide.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{guide.equipment}</p>
            </div>
            <button onClick={onClose} className="flex-shrink-0 rounded-full p-2 hover:bg-secondary">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', DIFFICULTY_COLORS[guide.difficulty])}>
              {guide.difficulty}
            </span>
            {guide.primaryMuscles.map(m => (
              <span key={m} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">{m}</span>
            ))}
            {guide.secondaryMuscles.slice(0, 2).map(m => (
              <span key={m} className="rounded-full border border-border bg-secondary/50 px-2.5 py-0.5 text-xs text-muted-foreground/60">{m}</span>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-5 space-y-3">
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
