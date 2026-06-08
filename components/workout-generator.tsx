'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-context'
import { Sparkles, Play, X, ChevronRight, Loader2, RotateCcw, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Body map muscle groups ───────────────────────────────────────────────────

interface MuscleGroup {
  id: string
  label: string
  view: 'front' | 'back' | 'both'
  paths: { d: string; viewId: string }[]
}

// SVG body silhouette muscle paths (front + back)
// Using a simplified but accurate body diagram
const MUSCLE_FRONT: Record<string, string> = {
  chest: 'M 108 112 C 108 108 112 100 120 98 C 130 96 138 102 140 110 C 142 118 140 128 134 132 C 128 136 118 135 113 130 C 108 125 108 118 108 112 Z M 160 98 C 168 96 176 100 180 108 C 184 116 182 128 177 133 C 172 138 160 137 155 132 C 150 127 150 116 154 108 C 156 103 158 99 160 98 Z',
  shoulders: 'M 90 90 C 88 86 84 78 86 70 C 88 62 96 60 102 64 C 108 68 108 78 106 86 C 104 92 98 96 94 94 Z M 194 64 C 200 60 208 62 210 70 C 212 78 208 92 202 96 C 198 98 192 92 190 86 C 188 78 188 68 194 64 Z',
  biceps: 'M 86 104 C 82 98 80 92 82 86 C 84 80 90 80 94 84 C 98 88 98 96 96 102 C 94 108 88 108 86 104 Z M 202 84 C 206 80 212 80 214 86 C 216 92 214 98 210 104 C 208 108 202 108 200 102 C 198 96 198 88 202 84 Z',
  abs: 'M 118 140 C 118 134 128 132 140 134 C 150 136 158 140 158 146 C 158 152 148 156 140 155 C 130 154 118 150 118 144 Z M 118 155 C 118 150 128 148 140 149 C 150 150 158 154 158 160 C 158 166 148 170 140 169 C 130 168 118 164 118 158 Z M 120 170 C 120 165 130 163 140 164 C 150 165 158 169 157 175 C 156 181 147 184 140 183 C 132 182 120 178 120 172 Z',
  quads: 'M 112 200 C 108 194 106 184 108 174 C 110 164 118 162 122 168 C 126 174 126 186 124 196 C 122 204 116 206 112 202 Z M 158 168 C 162 162 170 164 172 174 C 174 184 174 196 170 202 C 166 206 160 204 158 196 C 156 186 156 174 158 168 Z',
}

const MUSCLE_BACK: Record<string, string> = {
  traps: 'M 108 78 C 112 70 120 66 130 68 C 140 70 148 76 150 84 C 148 88 140 90 130 90 C 120 90 110 88 108 84 Z M 150 84 C 152 76 160 70 170 68 C 180 66 188 70 192 78 C 190 88 180 90 170 90 C 160 90 150 88 150 84 Z',
  lats: 'M 96 120 C 92 112 92 100 96 92 C 100 84 108 84 112 92 C 116 100 116 114 112 122 C 108 128 100 126 96 120 Z M 184 92 C 188 84 196 84 200 92 C 204 100 204 112 200 120 C 196 126 188 128 184 122 C 180 114 180 100 184 92 Z',
  lower_back: 'M 118 162 C 116 155 118 145 122 140 C 126 135 136 135 144 140 C 148 145 150 155 148 162 C 146 168 140 170 134 170 C 128 170 120 168 118 162 Z',
  glutes: 'M 108 190 C 106 182 108 172 114 166 C 120 160 130 162 134 170 C 136 176 134 188 130 196 C 126 202 116 202 112 196 Z M 134 170 C 138 162 148 160 154 166 C 160 172 162 182 160 190 C 158 196 148 202 144 196 C 140 188 132 176 134 170 Z',
  hamstrings: 'M 112 206 C 110 198 110 188 114 180 C 118 172 126 172 128 180 C 130 188 128 200 124 208 C 120 214 114 212 112 206 Z M 152 180 C 154 172 162 172 166 180 C 170 188 170 198 168 206 C 166 212 160 214 156 208 C 152 200 150 188 152 180 Z',
  calves: 'M 116 256 C 114 248 114 236 118 228 C 122 220 128 220 130 228 C 132 236 132 248 128 256 C 126 262 118 262 116 256 Z M 150 228 C 152 220 158 220 162 228 C 166 236 166 248 164 256 C 162 262 154 262 152 256 C 148 248 148 236 150 228 Z',
}

const MUSCLE_GROUPS: { id: string; label: string; emoji: string; description: string; view: 'front' | 'back' | 'both'; color: string }[] = [
  { id: 'chest', label: 'Chest', emoji: '💪', description: 'Pectorals', view: 'front', color: '#ef4444' },
  { id: 'back', label: 'Back', emoji: '🏋️', description: 'Lats & Rhomboids', view: 'back', color: '#3b82f6' },
  { id: 'shoulders', label: 'Shoulders', emoji: '🔱', description: 'All Deltoid Heads', view: 'both', color: '#8b5cf6' },
  { id: 'biceps', label: 'Biceps', emoji: '💪', description: 'Front Arms', view: 'front', color: '#f59e0b' },
  { id: 'triceps', label: 'Triceps', emoji: '🦾', description: 'Back Arms', view: 'back', color: '#f59e0b' },
  { id: 'abs', label: 'Abs & Core', emoji: '🎯', description: 'Core Muscles', view: 'front', color: '#22c55e' },
  { id: 'legs', label: 'Legs', emoji: '🦵', description: 'Quads, Hamstrings & Glutes', view: 'both', color: '#06b6d4' },
  { id: 'calves', label: 'Calves', emoji: '🦵', description: 'Gastrocnemius', view: 'back', color: '#64748b' },
  { id: 'full_body', label: 'Full Body', emoji: '⚡', description: 'Complete Workout', view: 'both', color: '#f97316' },
]

// ─── Exercise video library per muscle ───────────────────────────────────────

const MUSCLE_EXERCISES: Record<string, { name: string; sets: string; reps: string; youtubeId: string; tip: string }[]> = {
  chest: [
    { name: 'Barbell Bench Press', sets: '4', reps: '6-8', youtubeId: 'vcBig73ojpE', tip: 'Arch back, plant feet, bar to lower chest' },
    { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12', youtubeId: 'jPLdzuHckI8', tip: 'Targets upper chest — full ROM' },
    { name: 'Cable Fly', sets: '3', reps: '12-15', youtubeId: 'taI4XduLpTk', tip: 'Squeeze at the top, feel the stretch' },
    { name: 'Weighted Dips', sets: '3', reps: '8-10', youtubeId: '2z8JmcrW-As', tip: 'Lean forward to shift emphasis to chest' },
    { name: 'Push-Up Finisher', sets: '2', reps: 'To failure', youtubeId: '0pkjOk0EiAk', tip: 'Blood-pumping burnout to end the session' },
  ],
  back: [
    { name: 'Deadlift', sets: '4', reps: '4-6', youtubeId: 'op9kVnSso6Q', tip: 'Neutral spine, bar over mid-foot' },
    { name: 'Pull-Ups', sets: '4', reps: '6-10', youtubeId: 'eGo4IYlbE5g', tip: 'Dead hang to chin over bar, full ROM' },
    { name: 'Barbell Row', sets: '4', reps: '8-10', youtubeId: 'FWJR5Ve8bnQ', tip: 'Hinge at hips, pull to lower chest' },
    { name: 'Lat Pulldown', sets: '3', reps: '10-12', youtubeId: 'CAwf7n6Luuc', tip: 'Pull elbows to floor, lean slightly back' },
    { name: 'Face Pull', sets: '3', reps: '15-20', youtubeId: 'rep-qVOkqgk', tip: 'External rotation — crucial for shoulder health' },
  ],
  shoulders: [
    { name: 'Overhead Press', sets: '4', reps: '6-8', youtubeId: '2yjwXTZQDDI', tip: 'Core braced, press in front of face' },
    { name: 'Lateral Raise', sets: '4', reps: '12-15', youtubeId: 'yzJ5a4rMb1Q', tip: 'Lead with elbow, slight forward lean' },
    { name: 'Arnold Press', sets: '3', reps: '10-12', youtubeId: 'vj2w851ZHRM', tip: 'Rotate palms out as you press' },
    { name: 'Face Pull', sets: '3', reps: '15-20', youtubeId: 'rep-qVOkqgk', tip: 'Eye level, external rotation at end range' },
    { name: 'Rear Delt Fly', sets: '3', reps: '15-20', youtubeId: 'EA7u4Q_8HQ0', tip: 'Hinge forward, lead with elbows' },
  ],
  biceps: [
    { name: 'Barbell Curl', sets: '4', reps: '8-10', youtubeId: 'kwG2ipFRgfo', tip: 'Elbows fixed, full supination at top' },
    { name: 'Incline Dumbbell Curl', sets: '3', reps: '10-12', youtubeId: 'soxrZlIl35U', tip: 'Stretch at bottom — huge peak builder' },
    { name: 'Hammer Curl', sets: '3', reps: '10-12', youtubeId: 'zC3nLlEvin4', tip: 'Builds brachialis for arm thickness' },
    { name: 'Concentration Curl', sets: '3', reps: '12-15', youtubeId: 'Jvj2wV0vOYU', tip: 'Supinate hard at top, squeeze 1 second' },
    { name: 'Cable Curl', sets: '2', reps: '15-20', youtubeId: 'av7-8igSXTs', tip: 'Constant tension pump finisher' },
  ],
  triceps: [
    { name: 'Close-Grip Bench Press', sets: '4', reps: '6-8', youtubeId: 'nEF0bv2FW04', tip: 'Heaviest tricep movement — tuck elbows' },
    { name: 'Skull Crusher', sets: '3', reps: '10-12', youtubeId: 'NIvZczqo0Ck', tip: 'Lower to forehead slowly, full extension' },
    { name: 'Tricep Pushdown', sets: '3', reps: '12-15', youtubeId: '2-LAMcpzODU', tip: 'Elbows fixed, squeeze at lockout' },
    { name: 'Overhead Tricep Extension', sets: '3', reps: '10-12', youtubeId: 'YybX7Wd8jQ-Q', tip: 'Long head stretch for full development' },
    { name: 'Dips', sets: '2', reps: 'To failure', youtubeId: '2z8JmcrW-As', tip: 'Stay upright for tricep emphasis' },
  ],
  abs: [
    { name: 'Cable Crunch', sets: '4', reps: '12-15', youtubeId: 'GtW9HSVUDaI', tip: 'Round your spine — don\'t just hip hinge' },
    { name: 'Hanging Leg Raise', sets: '4', reps: '10-12', youtubeId: 'Pr1ieGZ5atk', tip: 'Pelvis posterior tilt at top' },
    { name: 'Ab Wheel', sets: '3', reps: '10-15', youtubeId: 'j7FTWLs70Bg', tip: 'Pull back with core, not arms' },
    { name: 'Russian Twist', sets: '3', reps: '20 total', youtubeId: 'wkD8rjkodUI', tip: 'Touch floor each side, slow rotation' },
    { name: 'Plank', sets: '3', reps: '45-60 sec', youtubeId: 'ASdvSqZQDkI', tip: 'Squeeze every muscle, breathe normally' },
  ],
  legs: [
    { name: 'Barbell Back Squat', sets: '4', reps: '6-8', youtubeId: 'ultWZbUMPL8', tip: 'Depth below parallel, knees out' },
    { name: 'Romanian Deadlift', sets: '4', reps: '8-10', youtubeId: '2SHsk9AzdjA', tip: 'Feel hamstring stretch, hinge don\'t squat' },
    { name: 'Leg Press', sets: '3', reps: '10-12', youtubeId: 'IZxyjW7MPJQ', tip: 'Full depth, don\'t lock knees' },
    { name: 'Hip Thrust', sets: '4', reps: '10-12', youtubeId: '8bbE64NuDTU', tip: 'Posterior pelvic tilt, squeeze hard at top' },
    { name: 'Walking Lunges', sets: '3', reps: '12 each leg', youtubeId: 'QOVaHwm-Q6U', tip: 'Upright torso, full knee range' },
    { name: 'Leg Extension', sets: '3', reps: '15-20', youtubeId: 'YyvSfVjQeL0', tip: 'Full extension, squeeze quads' },
  ],
  calves: [
    { name: 'Standing Calf Raise', sets: '5', reps: '12-15', youtubeId: 'gwLzBJYoWlI', tip: 'Full stretch at bottom, pause at top' },
    { name: 'Seated Calf Raise', sets: '4', reps: '15-20', youtubeId: '9Iut4uq-noU', tip: 'Targets soleus — different than standing' },
    { name: 'Single-Leg Calf Raise', sets: '3', reps: '15 each', youtubeId: 'JbyjNymZOt0', tip: 'Fix imbalances, maximum stretch' },
  ],
  full_body: [
    { name: 'Barbell Deadlift', sets: '4', reps: '4-6', youtubeId: 'op9kVnSso6Q', tip: 'The king — full posterior chain' },
    { name: 'Barbell Squat', sets: '4', reps: '6-8', youtubeId: 'ultWZbUMPL8', tip: 'The queen — complete leg development' },
    { name: 'Bench Press', sets: '4', reps: '6-8', youtubeId: 'vcBig73ojpE', tip: 'Upper body push strength benchmark' },
    { name: 'Pull-Ups', sets: '4', reps: '6-10', youtubeId: 'eGo4IYlbE5g', tip: 'Upper body pull — lats, bis, all of it' },
    { name: 'Overhead Press', sets: '3', reps: '8-10', youtubeId: '2yjwXTZQDDI', tip: 'Shoulder strength and core stability' },
    { name: 'Barbell Row', sets: '3', reps: '8-10', youtubeId: 'FWJR5Ve8bnQ', tip: 'Mid-back thickness and pull strength' },
  ],
}

// ─── Video Card ───────────────────────────────────────────────────────────────

function ExerciseVideoCard({ ex, index }: {
  ex: { name: string; sets: string; reps: string; youtubeId: string; tip: string }
  index: number
}) {
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <>
      <div
        className="rounded-2xl border border-border bg-card overflow-hidden animate-in fade-in slide-in-from-bottom-2"
        style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
      >
        {/* Thumbnail with play button */}
        <div
          className="relative w-full cursor-pointer group"
          style={{ aspectRatio: '16/7' }}
          onClick={() => setVideoOpen(true)}
        >
          <img
            src={`https://img.youtube.com/vi/${ex.youtubeId}/mqdefault.jpg`}
            alt={ex.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="h-5 w-5 text-white fill-white ml-0.5" />
            </div>
          </div>
          <div className="absolute top-2 left-2">
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
              #{index + 1}
            </span>
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-bold text-foreground text-sm">{ex.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{ex.tip}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold text-primary">{ex.sets} sets</p>
              <p className="text-xs text-muted-foreground">{ex.reps} reps</p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden bg-black border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div>
                <p className="font-bold text-white text-sm">{ex.name}</p>
                <p className="text-xs text-white/50">{ex.sets} sets × {ex.reps}</p>
              </div>
              <button onClick={() => setVideoOpen(false)} className="rounded-full p-2 hover:bg-white/10">
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <iframe
                src={`https://www.youtube.com/embed/${ex.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={ex.name}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <div className="p-3 bg-black">
              <p className="text-sm text-white/60">{ex.tip}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Interactive Body Map SVG ─────────────────────────────────────────────────

function BodyMap({ selected, onSelect }: {
  selected: string[]
  onSelect: (id: string) => void
}) {
  const [view, setView] = useState<'front' | 'back'>('front')

  const frontMuscles = MUSCLE_GROUPS.filter(m => m.view === 'front' || m.view === 'both')
  const backMuscles = MUSCLE_GROUPS.filter(m => m.view === 'back' || m.view === 'both')
  const visibleMuscles = view === 'front' ? frontMuscles : backMuscles

  return (
    <div className="space-y-3">
      {/* Front/Back toggle */}
      <div className="flex gap-2 rounded-2xl bg-secondary/60 p-1">
        {(['front', 'back'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              'flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition-all',
              view === v ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            {v} View
          </button>
        ))}
      </div>

      <div className="flex gap-3 items-start">
        {/* Body SVG */}
        <div className="flex-shrink-0 w-28">
          <svg viewBox="0 0 280 380" className="w-full">
            {/* Body silhouette */}
            {view === 'front' ? (
              <g fill="none">
                {/* Head */}
                <ellipse cx="140" cy="38" rx="28" ry="32" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
                {/* Neck */}
                <rect x="128" y="68" width="24" height="20" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
                {/* Torso */}
                <path d="M 96 88 C 88 90 80 96 78 106 L 74 180 C 72 190 78 196 88 196 L 192 196 C 202 196 208 190 206 180 L 202 106 C 200 96 192 90 184 88 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                {/* Left arm */}
                <path d="M 80 100 C 70 104 64 114 62 126 L 60 168 C 58 178 62 188 70 190 L 80 190 C 72 182 72 170 74 158 L 78 118 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                {/* Right arm */}
                <path d="M 200 100 C 210 104 216 114 218 126 L 220 168 C 222 178 218 188 210 190 L 200 190 C 208 182 208 170 206 158 L 202 118 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                {/* Left forearm */}
                <path d="M 62 168 L 56 200 C 54 208 56 216 62 220 L 68 220 C 66 214 66 206 68 198 L 72 168 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                {/* Right forearm */}
                <path d="M 218 168 L 224 200 C 226 208 224 216 218 220 L 212 220 C 214 214 214 206 212 198 L 208 168 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                {/* Left leg */}
                <path d="M 92 196 L 88 290 C 86 300 90 312 98 314 L 110 314 C 104 306 104 294 106 284 L 114 196 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                {/* Right leg */}
                <path d="M 166 196 L 174 284 C 176 294 176 306 170 314 L 182 314 C 190 312 194 300 192 290 L 188 196 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                {/* Left calf */}
                <path d="M 98 314 L 96 356 C 94 364 98 372 106 372 L 114 372 C 110 364 110 354 112 344 L 110 314 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                {/* Right calf */}
                <path d="M 170 314 L 168 344 C 170 354 170 364 166 372 L 174 372 C 182 372 186 364 184 356 L 182 314 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>

                {/* Highlighted muscles */}
                {/* Chest */}
                <ellipse cx="118" cy="118" rx="24" ry="18"
                  fill={selected.includes('chest') ? '#ef444488' : 'transparent'}
                  stroke={selected.includes('chest') ? '#ef4444' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-red-500/30 transition-colors"
                  onClick={() => onSelect('chest')}
                />
                <ellipse cx="162" cy="118" rx="24" ry="18"
                  fill={selected.includes('chest') ? '#ef444488' : 'transparent'}
                  stroke={selected.includes('chest') ? '#ef4444' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-red-500/30 transition-colors"
                  onClick={() => onSelect('chest')}
                />
                {/* Shoulders */}
                <ellipse cx="84" cy="100" rx="16" ry="14"
                  fill={selected.includes('shoulders') ? '#8b5cf688' : 'transparent'}
                  stroke={selected.includes('shoulders') ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-purple-500/30 transition-colors"
                  onClick={() => onSelect('shoulders')}
                />
                <ellipse cx="196" cy="100" rx="16" ry="14"
                  fill={selected.includes('shoulders') ? '#8b5cf688' : 'transparent'}
                  stroke={selected.includes('shoulders') ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-purple-500/30 transition-colors"
                  onClick={() => onSelect('shoulders')}
                />
                {/* Biceps */}
                <ellipse cx="70" cy="145" rx="12" ry="20"
                  fill={selected.includes('biceps') ? '#f59e0b88' : 'transparent'}
                  stroke={selected.includes('biceps') ? '#f59e0b' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-amber-500/30 transition-colors"
                  onClick={() => onSelect('biceps')}
                />
                <ellipse cx="210" cy="145" rx="12" ry="20"
                  fill={selected.includes('biceps') ? '#f59e0b88' : 'transparent'}
                  stroke={selected.includes('biceps') ? '#f59e0b' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-amber-500/30 transition-colors"
                  onClick={() => onSelect('biceps')}
                />
                {/* Abs */}
                <rect x="118" y="140" width="44" height="50" rx="8"
                  fill={selected.includes('abs') ? '#22c55e88' : 'transparent'}
                  stroke={selected.includes('abs') ? '#22c55e' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-green-500/30 transition-colors"
                  onClick={() => onSelect('abs')}
                />
                {/* Quads */}
                <ellipse cx="110" cy="246" rx="20" ry="44"
                  fill={selected.includes('legs') ? '#06b6d488' : 'transparent'}
                  stroke={selected.includes('legs') ? '#06b6d4' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-cyan-500/30 transition-colors"
                  onClick={() => onSelect('legs')}
                />
                <ellipse cx="170" cy="246" rx="20" ry="44"
                  fill={selected.includes('legs') ? '#06b6d488' : 'transparent'}
                  stroke={selected.includes('legs') ? '#06b6d4' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-cyan-500/30 transition-colors"
                  onClick={() => onSelect('legs')}
                />
                {/* Calves */}
                <ellipse cx="108" cy="344" rx="14" ry="26"
                  fill={selected.includes('calves') ? '#64748b88' : 'transparent'}
                  stroke={selected.includes('calves') ? '#64748b' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-slate-500/30 transition-colors"
                  onClick={() => onSelect('calves')}
                />
                <ellipse cx="172" cy="344" rx="14" ry="26"
                  fill={selected.includes('calves') ? '#64748b88' : 'transparent'}
                  stroke={selected.includes('calves') ? '#64748b' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-slate-500/30 transition-colors"
                  onClick={() => onSelect('calves')}
                />
              </g>
            ) : (
              <g fill="none">
                {/* Body silhouette back */}
                <ellipse cx="140" cy="38" rx="28" ry="32" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
                <rect x="128" y="68" width="24" height="20" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
                <path d="M 96 88 L 184 88 L 206 196 L 74 196 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                <path d="M 80 100 L 62 190 L 72 190 L 88 110 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                <path d="M 200 100 L 218 190 L 208 190 L 192 110 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                <path d="M 92 196 L 106 314 L 120 314 L 114 196 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                <path d="M 166 196 L 160 314 L 174 314 L 188 196 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                <path d="M 106 314 L 108 372 L 120 372 L 120 314 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                <path d="M 160 314 L 160 372 L 172 372 L 174 314 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>

                {/* Traps */}
                <path d="M 110 90 C 118 86 132 86 140 92 C 148 86 162 86 170 90 C 160 100 140 104 120 100 Z"
                  fill={selected.includes('back') ? '#3b82f688' : 'transparent'}
                  stroke={selected.includes('back') ? '#3b82f6' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-blue-500/30 transition-colors"
                  onClick={() => onSelect('back')}
                />
                {/* Lats */}
                <ellipse cx="100" cy="145" rx="20" ry="38"
                  fill={selected.includes('back') ? '#3b82f688' : 'transparent'}
                  stroke={selected.includes('back') ? '#3b82f6' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-blue-500/30 transition-colors"
                  onClick={() => onSelect('back')}
                />
                <ellipse cx="180" cy="145" rx="20" ry="38"
                  fill={selected.includes('back') ? '#3b82f688' : 'transparent'}
                  stroke={selected.includes('back') ? '#3b82f6' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-blue-500/30 transition-colors"
                  onClick={() => onSelect('back')}
                />
                {/* Shoulders back */}
                <ellipse cx="84" cy="100" rx="16" ry="14"
                  fill={selected.includes('shoulders') ? '#8b5cf688' : 'transparent'}
                  stroke={selected.includes('shoulders') ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-purple-500/30 transition-colors"
                  onClick={() => onSelect('shoulders')}
                />
                <ellipse cx="196" cy="100" rx="16" ry="14"
                  fill={selected.includes('shoulders') ? '#8b5cf688' : 'transparent'}
                  stroke={selected.includes('shoulders') ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-purple-500/30 transition-colors"
                  onClick={() => onSelect('shoulders')}
                />
                {/* Triceps */}
                <ellipse cx="70" cy="145" rx="12" ry="20"
                  fill={selected.includes('triceps') ? '#f59e0b88' : 'transparent'}
                  stroke={selected.includes('triceps') ? '#f59e0b' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-amber-500/30 transition-colors"
                  onClick={() => onSelect('triceps')}
                />
                <ellipse cx="210" cy="145" rx="12" ry="20"
                  fill={selected.includes('triceps') ? '#f59e0b88' : 'transparent'}
                  stroke={selected.includes('triceps') ? '#f59e0b' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-amber-500/30 transition-colors"
                  onClick={() => onSelect('triceps')}
                />
                {/* Lower back */}
                <ellipse cx="140" cy="172" rx="28" ry="18"
                  fill={selected.includes('back') ? '#3b82f688' : 'transparent'}
                  stroke={selected.includes('back') ? '#3b82f6' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-blue-500/30 transition-colors"
                  onClick={() => onSelect('back')}
                />
                {/* Glutes / Hamstrings */}
                <ellipse cx="110" cy="214" rx="24" ry="20"
                  fill={selected.includes('legs') ? '#06b6d488' : 'transparent'}
                  stroke={selected.includes('legs') ? '#06b6d4' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-cyan-500/30 transition-colors"
                  onClick={() => onSelect('legs')}
                />
                <ellipse cx="170" cy="214" rx="24" ry="20"
                  fill={selected.includes('legs') ? '#06b6d488' : 'transparent'}
                  stroke={selected.includes('legs') ? '#06b6d4' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-cyan-500/30 transition-colors"
                  onClick={() => onSelect('legs')}
                />
                <ellipse cx="110" cy="266" rx="18" ry="40"
                  fill={selected.includes('legs') ? '#06b6d488' : 'transparent'}
                  stroke={selected.includes('legs') ? '#06b6d4' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-cyan-500/30 transition-colors"
                  onClick={() => onSelect('legs')}
                />
                <ellipse cx="170" cy="266" rx="18" ry="40"
                  fill={selected.includes('legs') ? '#06b6d488' : 'transparent'}
                  stroke={selected.includes('legs') ? '#06b6d4' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-cyan-500/30 transition-colors"
                  onClick={() => onSelect('legs')}
                />
                {/* Calves back */}
                <ellipse cx="110" cy="344" rx="14" ry="26"
                  fill={selected.includes('calves') ? '#64748b88' : 'transparent'}
                  stroke={selected.includes('calves') ? '#64748b' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-slate-500/30 transition-colors"
                  onClick={() => onSelect('calves')}
                />
                <ellipse cx="170" cy="344" rx="14" ry="26"
                  fill={selected.includes('calves') ? '#64748b88' : 'transparent'}
                  stroke={selected.includes('calves') ? '#64748b' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  className="cursor-pointer hover:fill-slate-500/30 transition-colors"
                  onClick={() => onSelect('calves')}
                />
              </g>
            )}
          </svg>
        </div>

        {/* Muscle buttons */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {MUSCLE_GROUPS.filter(m => view === 'front' ? m.view !== 'back' : m.view !== 'front').map(muscle => (
            <button
              key={muscle.id}
              onClick={() => onSelect(muscle.id)}
              className={cn(
                'flex flex-col items-start rounded-xl p-2.5 text-left transition-all border',
                selected.includes(muscle.id)
                  ? 'border-transparent text-white'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              )}
              style={selected.includes(muscle.id) ? {
                backgroundColor: muscle.color + '22',
                borderColor: muscle.color + '66',
              } : {}}
            >
              <span className="text-base">{muscle.emoji}</span>
              <span className="text-xs font-bold mt-0.5" style={selected.includes(muscle.id) ? { color: muscle.color } : {}}>
                {muscle.label}
              </span>
              <span className="text-[9px] opacity-60">{muscle.description}</span>
            </button>
          ))}
          {/* Full Body always visible */}
          <button
            onClick={() => onSelect('full_body')}
            className={cn(
              'col-span-2 flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all border',
              selected.includes('full_body')
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            <span>⚡</span>
            <div>
              <p className="text-xs font-bold">Full Body</p>
              <p className="text-[9px] opacity-60">Complete Workout</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main WorkoutGeneratorSection ────────────────────────────────────────────

export function WorkoutGeneratorSection() {
  const { settings } = useApp()
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([])
  const [generated, setGenerated] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)

  const handleSelect = (id: string) => {
    if (id === 'full_body') {
      setSelectedMuscles(prev => prev.includes('full_body') ? [] : ['full_body'])
      setGenerated(false)
      return
    }
    setSelectedMuscles(prev => {
      const withoutFull = prev.filter(m => m !== 'full_body')
      return withoutFull.includes(id)
        ? withoutFull.filter(m => m !== id)
        : [...withoutFull, id]
    })
    setGenerated(false)
  }

  const handleGenerate = () => {
    if (selectedMuscles.length === 0) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setGenerated(true)
    }, 1200)
  }

  // Combine exercises from all selected muscles
  const workoutExercises = selectedMuscles.flatMap(muscleId => {
    const exList = MUSCLE_EXERCISES[muscleId] || []
    // If multiple muscles selected, take top 3 from each; otherwise all 5
    return selectedMuscles.length > 1 ? exList.slice(0, 3) : exList
  })

  const totalSets = workoutExercises.reduce((sum, ex) => sum + parseInt(ex.sets), 0)
  const estimatedTime = Math.round(totalSets * 2.5) // ~2.5 min per set

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground">AI Workout Generator</p>
            <p className="text-xs text-muted-foreground">Tap muscles or pick from the list</p>
          </div>
        </div>
      </div>

      {/* Body map */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Select Muscle Groups</p>
        <BodyMap selected={selectedMuscles} onSelect={handleSelect} />
      </div>

      {/* Selected summary */}
      {selectedMuscles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMuscles.map(id => {
            const m = MUSCLE_GROUPS.find(g => g.id === id)
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: (m?.color || '#6b7280') + '33', border: `1px solid ${m?.color || '#6b7280'}66` }}
              >
                <span>{m?.emoji}</span>
                {m?.label}
                <X className="h-3 w-3 ml-0.5" />
              </button>
            )
          })}
          <button
            onClick={() => { setSelectedMuscles([]); setGenerated(false) }}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground border border-border"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={selectedMuscles.length === 0 || loading}
        className={cn(
          'w-full rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all',
          selectedMuscles.length > 0
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90'
            : 'bg-secondary/60 text-muted-foreground cursor-not-allowed'
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Building your workout...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            {generated ? 'Regenerate Workout' : 'Generate Workout'}
          </>
        )}
      </button>

      {/* Generated workout */}
      {generated && !loading && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Exercises', value: workoutExercises.length },
              { label: 'Total Sets', value: totalSets },
              { label: 'Est. Time', value: `${estimatedTime}m` },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-3 text-center">
                <p className="text-lg font-black text-primary">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-black text-foreground text-base">
              {selectedMuscles.map(id => MUSCLE_GROUPS.find(g => g.id === id)?.label).join(' + ')} Day
            </h3>
            <span className="text-xs text-muted-foreground">Tap any exercise to watch</span>
          </div>

          {/* Exercise cards with videos */}
          <div className="space-y-3">
            {workoutExercises.map((ex, i) => (
              <ExerciseVideoCard key={`${ex.name}-${i}`} ex={ex} index={i} />
            ))}
          </div>

          {/* CTA */}
          <button className="w-full rounded-2xl bg-green-500/10 border border-green-500/30 py-4 text-sm font-bold text-green-400 flex items-center justify-center gap-2">
            <Play className="h-4 w-4 fill-green-400" />
            Start This Workout
          </button>
        </div>
      )}
    </div>
  )
}
