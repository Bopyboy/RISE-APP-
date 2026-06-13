'use client'

import { useEffect, useState } from 'react'
import { Search, X, ChevronDown, ChevronUp, Dumbbell, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExerciseEntry {
  id: string
  name: string
  category: string
  muscle: string
  specificMuscle: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  equipment: string
  unit: 'lbs' | 'reps' | 'sec' | 'miles'
  youtubeId: string
  cues: string[]
  description: string
}

// ─── Animation Folder Map ─────────────────────────────────────────────────────
// Every exercise id → folder name in https://github.com/yuhonas/free-exercise-db
// The folder contains 0.jpg (start) and 1.jpg (end). We crossfade between them
// to produce a real motion preview for EVERY exercise.

const FREE_DB_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

const EXERCISE_FOLDERS: Record<string, string> = {
  // Chest
  bench: 'Barbell_Bench_Press_-_Medium_Grip',
  incline_bench: 'Barbell_Incline_Bench_Press_-_Medium_Grip',
  decline_bench: 'Decline_Barbell_Bench_Press',
  incline_db_press: 'Incline_Dumbbell_Press',
  dbfly: 'Dumbbell_Flyes',
  pushup: 'Pushups',
  dips: 'Dips_-_Chest_Version',
  cable_fly: 'Cable_Crossover',
  high_cable_fly: 'Cable_Crossover',
  chest_press_machine: 'Machine_Bench_Press',

  // Back
  deadlift: 'Barbell_Deadlift',
  pullup: 'Pullups',
  chinup: 'Chin-Up',
  row: 'Bent_Over_Barbell_Row',
  latpull: 'Wide-Grip_Lat_Pulldown',
  seated_row: 'Seated_Cable_Rows',
  db_row: 'One-Arm_Dumbbell_Row',
  rdl: 'Romanian_Deadlift',
  goodmorning: 'Good_Morning',
  tbar_row: 'T-Bar_Row_with_Handle',
  face_pull_rear: 'Straight-Arm_Pulldown',

  // Shoulders
  ohp: 'Standing_Military_Press',
  lateral: 'Side_Lateral_Raise',
  cable_lateral: 'Cable_Seated_Lateral_Raise',
  front_raise: 'Front_Dumbbell_Raise',
  facepull: 'Face_Pull',
  reverse_fly: 'Reverse_Flyes',
  shrug: 'Barbell_Shrug',
  arnold_press: 'Arnold_Dumbbell_Press',
  upright_row: 'Upright_Barbell_Row',

  // Arms — biceps
  curl: 'Barbell_Curl',
  incline_curl: 'Incline_Dumbbell_Curl',
  hammer: 'Hammer_Curls',
  preacher_curl: 'Preacher_Curl',
  concentration_curl: 'Concentration_Curls',
  cable_curl: 'Cable_Curl',

  // Arms — triceps
  pushdown: 'Triceps_Pushdown_-_Rope_Attachment',
  closebench: 'Close-Grip_Barbell_Bench_Press',
  skull_crusher: 'EZ-Bar_Skullcrusher',
  overhead_tricep: 'Cable_Rope_Overhead_Triceps_Extension',
  tricep_dips: 'Bench_Dips',

  // Legs
  squat: 'Barbell_Squat',
  front_squat: 'Front_Barbell_Squat',
  legpress: 'Leg_Press',
  lunge: 'Dumbbell_Lunges',
  leg_curl: 'Seated_Leg_Curl',
  nordics: 'Natural_Glute_Ham_Raise',
  leg_extension: 'Leg_Extensions',
  hip_thrust: 'Barbell_Hip_Thrust',
  glute_kickback: 'Glute_Kickback',
  calf_raise: 'Standing_Calf_Raises',
  seated_calf: 'Seated_Calf_Raise',
  sumo_deadlift: 'Sumo_Deadlift',

  // Core
  plank: 'Plank',
  situp: 'Sit-Up',
  hangleg: 'Hanging_Leg_Raise',
  abwheel: 'Ab_Roller',
  russian_twist: 'Russian_Twist',
  cable_crunch: 'Cable_Crunch',
  side_plank: 'Side_Bridge',
  dead_bug: 'Dead_Bug',
  leg_raise: 'Lying_Leg_Raise',

  // Cardio
  run: 'Running_Treadmill',
  rowing: 'Rowing_Stationary',
  jump_rope: 'Rope_Jumping',
  burpee: 'Mountain_Climbers',
  bike: 'Recumbent_Bike',
  hiit_sprint: 'Mountain_Climbers',

  // Olympic
  clean: 'Power_Clean',
  snatch: 'Snatch',
  clean_jerk: 'Clean_and_Jerk',
  hang_clean: 'Hang_Clean',

  // Calisthenics
  muscle_up: 'Muscle_Up',
  handstand: 'Handstand_Push-Ups',
  pistol: 'Kettlebell_Pistol_Squat',
  dragon_flag: 'Hanging_Leg_Raise',
  l_sit: 'Hanging_Leg_Raise',
  ring_dip: 'Ring_Dips',
}

function getFrames(id: string): { start: string; end: string } | null {
  const folder = EXERCISE_FOLDERS[id]
  if (!folder) return null
  return {
    start: `${FREE_DB_BASE}/${folder}/0.jpg`,
    end: `${FREE_DB_BASE}/${folder}/1.jpg`,
  }
}

// ─── Inline Animation ─────────────────────────────────────────────────────────

function ExerciseAnimation({ exercise }: { exercise: ExerciseEntry }) {
  const frames = getFrames(exercise.id)
  const [frame, setFrame] = useState<0 | 1>(0)
  const [playing, setPlaying] = useState(true)
  const [failedStart, setFailedStart] = useState(false)
  const [failedEnd, setFailedEnd] = useState(false)

  const lower = exercise.name.toLowerCase()
  const tempoMs = (() => {
    if (/(jump rope|mountain|hiit|sprint|burpee|bike|cycling|treadmill|run|rowing|elliptical|stair)/.test(lower)) return 380
    if (/(curl|raise|fly|pushdown|extension|shrug|calf|crunch|twist|plank|dead bug|kickback)/.test(lower)) return 750
    if (/(deadlift|squat|bench|press|row|pull-up|pullup|chin|clean|snatch|jerk|muscle-up)/.test(lower)) return 950
    return 850
  })()

  useEffect(() => {
    if (!playing || !frames) return
    const id = window.setInterval(() => setFrame(p => (p === 0 ? 1 : 0)), tempoMs)
    return () => window.clearInterval(id)
  }, [playing, tempoMs, frames])

  if (!frames || (failedStart && failedEnd)) {
    // Fallback: link out to YouTube if we genuinely can't render frames
    return (
      <a
        href={`https://www.youtube.com/watch?v=${exercise.youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-video items-center justify-center rounded-2xl border border-border bg-secondary/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        ▶ Watch reference video
      </a>
    )
  }

  const onlyStart = failedEnd && !failedStart

  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card aspect-video relative">
      <img
        src={frames.start}
        alt={`${exercise.name} — start`}
        onError={() => setFailedStart(true)}
        draggable={false}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out',
          onlyStart ? 'opacity-100' : frame === 0 ? 'opacity-100' : 'opacity-0',
        )}
      />
      {!onlyStart && (
        <img
          src={frames.end}
          alt={`${exercise.name} — end`}
          onError={() => setFailedEnd(true)}
          draggable={false}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out',
            frame === 1 ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

      {!onlyStart && (
        <>
          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur px-2 py-0.5">
            <span className={cn('h-1.5 w-1.5 rounded-full transition-colors', frame === 0 ? 'bg-primary' : 'bg-white/30')} />
            <span className={cn('h-1.5 w-1.5 rounded-full transition-colors', frame === 1 ? 'bg-primary' : 'bg-white/30')} />
            <span className="ml-0.5 text-[10px] font-semibold text-white/90">
              {frame === 0 ? 'START' : 'END'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? 'Pause animation' : 'Play animation'}
            className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-[10px] font-semibold text-white/90 hover:bg-black/70 transition-colors"
          >
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {playing ? 'Pause' : 'Play'}
          </button>
        </>
      )}

      <span className="absolute bottom-1.5 left-2 text-[9px] font-medium text-white/60">
        animated reference
      </span>
    </div>
  )
}

// ─── Filter Definitions ───────────────────────────────────────────────────────

const EQUIPMENT_FILTERS = [
  { id: 'all',        label: 'All' },
  { id: 'Barbell',    label: 'Barbell' },
  { id: 'Dumbbell',   label: 'Dumbbell' },
  { id: 'Cable',      label: 'Cable' },
  { id: 'Machine',    label: 'Machine' },
  { id: 'Bodyweight', label: 'Bodyweight' },
  { id: 'Other',      label: 'Other' },
]

const MUSCLE_GROUP_FILTERS = [
  { id: 'all',          label: 'All',          emoji: '🏋️' },
  { id: 'chest',        label: 'Chest',        emoji: '💪' },
  { id: 'back',         label: 'Back',         emoji: '🏋️' },
  { id: 'shoulders',    label: 'Shoulders',    emoji: '🔱' },
  { id: 'arms',         label: 'Arms',         emoji: '💪' },
  { id: 'legs',         label: 'Legs',         emoji: '🦵' },
  { id: 'core',         label: 'Core',         emoji: '🎯' },
  { id: 'cardio',       label: 'Cardio',       emoji: '🏃' },
  { id: 'olympic',      label: 'Olympic',      emoji: '🥇' },
  { id: 'calisthenics', label: 'Calisthenics', emoji: '🤸' },
]

const SPECIFIC_MUSCLE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Upper Pec',               label: 'Upper Pec' },
  { id: 'Mid Pec',                 label: 'Mid Pec' },
  { id: 'Lower Pec',               label: 'Lower Pec' },
  { id: 'Lats',                    label: 'Lats' },
  { id: 'Rhomboids',               label: 'Rhomboids' },
  { id: 'Mid Traps',               label: 'Mid Traps' },
  { id: 'Lower Back',              label: 'Lower Back' },
  { id: 'Front Delt',              label: 'Front Delt' },
  { id: 'Side Delt',               label: 'Side Delt' },
  { id: 'Rear Delt',               label: 'Rear Delt' },
  { id: 'Traps',                   label: 'Traps' },
  { id: 'Biceps Long Head',        label: 'Biceps Long Head' },
  { id: 'Biceps Short Head',       label: 'Biceps Short Head' },
  { id: 'Brachialis',              label: 'Brachialis' },
  { id: 'Triceps Long Head',       label: 'Triceps Long Head' },
  { id: 'Triceps Lateral Head',    label: 'Triceps Lateral Head' },
  { id: 'Triceps Medial Head',     label: 'Triceps Medial Head' },
  { id: 'Quads',                   label: 'Quads' },
  { id: 'Hamstrings',              label: 'Hamstrings' },
  { id: 'Glutes',                  label: 'Glutes' },
  { id: 'Calves',                  label: 'Calves' },
  { id: 'Hip Flexors',             label: 'Hip Flexors' },
  { id: 'Upper Abs',               label: 'Upper Abs' },
  { id: 'Lower Abs',               label: 'Lower Abs' },
  { id: 'Obliques',                label: 'Obliques' },
  { id: 'Transverse Abdominis',    label: 'Transverse Abdominis' },
]

// ─── Exercise Database ────────────────────────────────────────────────────────
// NOTE: this is the same list as before — only the card UI changes below.

const ALL_EXERCISES: ExerciseEntry[] = [
  // ── CHEST ──
  { id: 'bench',              name: 'Bench Press',            category: 'chest',        muscle: 'Chest',     specificMuscle: 'Mid Pec',             difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'vcBig73ojpE', cues: ['Retract scapula', 'Arch back slightly', 'Bar to lower chest', 'Drive feet into floor'],      description: 'The king of chest exercises. Build mass and strength across the entire pec.' },
  { id: 'incline_bench',      name: 'Incline Bench Press',    category: 'chest',        muscle: 'Chest',     specificMuscle: 'Upper Pec',            difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'jPLdzuHckI8', cues: ['Set bench 30–45°', 'Bar to upper chest', 'Elbows at 45°', 'Control descent'],                description: 'Targets the clavicular head for a full, rounded chest development.' },
  { id: 'decline_bench',      name: 'Decline Bench Press',    category: 'chest',        muscle: 'Chest',     specificMuscle: 'Lower Pec',            difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'LfyQTbGxHcE', cues: ['Feet secured', 'Bar to lower chest', 'Control descent', 'Full lockout'],                   description: 'Hits the lower chest hard. Great for a complete, well-defined pec.' },
  { id: 'incline_db_press',   name: 'Incline DB Press',       category: 'chest',        muscle: 'Chest',     specificMuscle: 'Upper Pec',            difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: '8iPEnn-ltC8', cues: ['30–45° incline', 'Neutral to pronated grip', 'Full stretch at bottom', 'Squeeze at top'],   description: 'Dumbbell freedom allows deeper stretch and independent arm movement for upper pec.' },
  { id: 'dbfly',              name: 'Dumbbell Fly',           category: 'chest',        muscle: 'Chest',     specificMuscle: 'Mid Pec',             difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'eozdVDA78K0', cues: ['Slight elbow bend', 'Open arms wide', 'Feel stretch at bottom', 'Squeeze at top'],        description: 'Isolates the chest with a wide range of motion for maximum stretch and contraction.' },
  { id: 'pushup',             name: 'Push-Ups',               category: 'chest',        muscle: 'Chest',     specificMuscle: 'Mid Pec',             difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: '0pkjOk0EiAk', cues: ['Hands shoulder-width', 'Core tight', 'Full ROM', 'Elbows 45°'],                              description: 'The fundamental chest builder. Perfect form builds real strength.' },
  { id: 'dips',               name: 'Dips',                   category: 'chest',        muscle: 'Chest',     specificMuscle: 'Lower Pec',            difficulty: 'Intermediate', equipment: 'Bodyweight',unit: 'reps',  youtubeId: '2z8JmcrW-As', cues: ['Lean forward for chest', 'Lower until shoulders dip', 'Control descent', 'Full lockout'],    description: 'Compound movement that loads lower chest and triceps through deep range of motion.' },
  { id: 'cable_fly',          name: 'Cable Fly',              category: 'chest',        muscle: 'Chest',     specificMuscle: 'Mid Pec',             difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'taI4XduLpTk', cues: ['Constant tension', 'Slight elbow bend', 'Hinge at hips', 'Squeeze hands together'],          description: 'Constant cable tension maximizes the stretch and squeeze throughout the movement.' },
  { id: 'high_cable_fly',     name: 'High Cable Fly',         category: 'chest',        muscle: 'Chest',     specificMuscle: 'Lower Pec',            difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'taI4XduLpTk', cues: ['Cables above head', 'Pull down and in', 'Squeeze lower pec', 'Control return'],            description: 'Targets the lower pec with a downward cable fly motion.' },
  { id: 'chest_press_machine',name: 'Chest Press Machine',    category: 'chest',        muscle: 'Chest',     specificMuscle: 'Mid Pec',             difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: 'xUm0BiZCWlQ', cues: ['Seat height matters', 'Push straight forward', "Don't lock out hard", 'Slow negatives'],   description: 'Perfect for beginners or finishing sets to failure safely.' },

  // ── BACK ──
  { id: 'deadlift',           name: 'Deadlift',               category: 'back',         muscle: 'Back',      specificMuscle: 'Lower Back',           difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'op9kVnSso6Q', cues: ['Neutral spine', 'Bar over mid-foot', 'Hinge at hips', 'Drive floor away'],                   description: 'The most fundamental strength lift. Builds total-body power and posterior chain mass.' },
  { id: 'pullup',             name: 'Pull-Ups',               category: 'back',         muscle: 'Back',      specificMuscle: 'Lats',                 difficulty: 'Intermediate', equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'eGo4IYlbE5g', cues: ['Dead hang start', 'Depress scapula', 'Pull elbows to hips', 'Chin over bar'],                description: 'The ultimate upper body pulling test. Nothing builds lats like pull-ups.' },
  { id: 'chinup',             name: 'Chin-Ups',               category: 'back',         muscle: 'Back',      specificMuscle: 'Lats',                 difficulty: 'Intermediate', equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'brhRXlOhsAM', cues: ['Supinated grip', 'Pull chest to bar', 'Squeeze lats and biceps', 'Full hang'],               description: 'Underhand grip recruits more bicep. Great for lat and arm combo development.' },
  { id: 'row',                name: 'Barbell Row',            category: 'back',         muscle: 'Back',      specificMuscle: 'Rhomboids',            difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'FWJR5Ve8bnQ', cues: ['Hinge 45°', 'Pull to lower chest', 'Drive elbows back', 'Squeeze at top'],                  description: 'A mass-building row that hits mid and upper back with heavy loading.' },
  { id: 'latpull',            name: 'Lat Pulldown',           category: 'back',         muscle: 'Back',      specificMuscle: 'Lats',                 difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'CAwf7n6Luuc', cues: ['Lean back slightly', 'Pull to upper chest', 'Elbows down', 'Stretch at top'],                  description: 'The go-to exercise for building wide lats and V-taper width.' },
  { id: 'seated_row',         name: 'Seated Cable Row',       category: 'back',         muscle: 'Back',      specificMuscle: 'Mid Traps',            difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'GZbfZ033f74', cues: ['Sit tall', 'Row to navel', 'Squeeze rhomboids', 'Full stretch forward'],                    description: 'Develops thickness through the mid-back and rhomboids.' },
  { id: 'db_row',             name: 'Dumbbell Row',           category: 'back',         muscle: 'Back',      specificMuscle: 'Lats',                 difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'pYcpY20QaE8', cues: ['Brace on bench', 'Pull elbow high', 'Neutral spine', 'Full ROM'],                          description: 'Single-arm variation for balanced development and deep stretch.' },
  { id: 'rdl',                name: 'Romanian Deadlift',      category: 'back',         muscle: 'Back',      specificMuscle: 'Hamstrings',           difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: '2SHsk9AzdjA', cues: ["Hinge don't squat", 'Bar close to legs', 'Feel hamstring stretch', 'Neutral spine'],        description: 'Best exercise for hamstring length and posterior chain development.' },
  { id: 'goodmorning',        name: 'Good Morning',           category: 'back',         muscle: 'Back',      specificMuscle: 'Lower Back',           difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: '6TwPgHE1mFw', cues: ['Bar on traps', 'Hinge forward', 'Soft knee bend', 'Neutral spine always'],                  description: 'Strengthens the entire posterior chain with a powerful hip hinge.' },
  { id: 'tbar_row',           name: 'T-Bar Row',              category: 'back',         muscle: 'Back',      specificMuscle: 'Rhomboids',            difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'j3ZDDJRoMIE', cues: ['Neutral spine', 'Chest on pad', 'Pull elbows back', 'Squeeze hard at top'],                 description: 'Allows heavy loading with a neutral spine for serious back thickness.' },
  { id: 'face_pull_rear',     name: 'Straight-Arm Pulldown',  category: 'back',         muscle: 'Back',      specificMuscle: 'Lats',                 difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'G_1xFGCGxEk', cues: ['Arms straight', 'Pull to hips', 'Squeeze lats', 'Slow eccentric'],                            description: 'Pure lat isolation keeping the arms straight throughout the movement.' },

  // ── SHOULDERS ──
  { id: 'ohp',                name: 'Overhead Press',         category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Front Delt',           difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: '2yjwXTZQDDI', cues: ['Bar in front of face', 'Tuck chin', 'Lock out at top', 'Core braced'],                         description: 'The definitive shoulder strength test. Builds width and pressing power.' },
  { id: 'lateral',            name: 'Lateral Raise',          category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Side Delt',            difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'yzJ5a4rMb1Q', cues: ['Lead with elbow', 'Slight forward lean', "Don't swing", 'Pour water at top'],               description: 'Isolates the medial delt for that boulder shoulder look and width.' },
  { id: 'cable_lateral',      name: 'Cable Lateral Raise',    category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Side Delt',            difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: '3VcKaXpzqRo', cues: ['Cable at hip', 'Raise across body', 'Lead with elbow', 'Control return'],                    description: 'Constant tension version of lateral raise — better muscle activation throughout.' },
  { id: 'front_raise',        name: 'Front Raise',            category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Front Delt',           difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'gkMFyd-bFJM', cues: ['Neutral or pronated grip', 'Raise to shoulder height', 'Control descent', 'No swinging'],    description: 'Targets the anterior deltoid for balanced front delt development.' },
  { id: 'facepull',           name: 'Face Pull',              category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Rear Delt',            difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'rep-qVOkqgk', cues: ['Cable at eye level', 'Pull to face', 'External rotation', 'Slow & controlled'],             description: 'Crucial for shoulder health and posterior delt thickness. A must-do.' },
  { id: 'reverse_fly',        name: 'Reverse Dumbbell Fly',   category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Rear Delt',            difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'ttvfGg9d76c', cues: ['Hinge forward', 'Arms slightly bent', 'Raise to shoulder height', 'Squeeze rear delt'],     description: 'Best rear delt isolation with dumbbells. Essential for balanced shoulders.' },
  { id: 'shrug',              name: 'Barbell Shrug',          category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Traps',                difficulty: 'Beginner',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'cJRVVxmytaM', cues: ['Straight up motion', 'No rolling', 'Full elevation', 'Pause at top'],                        description: 'Builds the traps for a powerful, thick upper back look.' },
  { id: 'arnold_press',       name: 'Arnold Press',           category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Front Delt',           difficulty: 'Intermediate', equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'vj2w851ZHRM', cues: ['Start palms facing you', 'Rotate while pressing', 'Full ROM', 'Control rotation'],           description: 'Created by the GOAT. Hits all three deltoid heads in one movement.' },
  { id: 'upright_row',        name: 'Upright Row',            category: 'shoulders',    muscle: 'Shoulders', specificMuscle: 'Side Delt',            difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'um3LNfH3vBs', cues: ['Elbows above hands', 'Pull to chin', 'Elbows flare out', 'Control down'],                    description: 'Compound shoulder movement that also recruits the traps and upper back.' },

  // ── ARMS ──
  { id: 'curl',               name: 'Barbell Curl',           category: 'arms',         muscle: 'Arms',      specificMuscle: 'Biceps Short Head',    difficulty: 'Beginner',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'kwG2ipFRgfo', cues: ['Elbows fixed', 'Full ROM', 'Squeeze at top', 'No swinging'],                               description: 'The most efficient bicep builder for peak and overall size.' },
  { id: 'incline_curl',       name: 'Incline Dumbbell Curl',  category: 'arms',         muscle: 'Arms',      specificMuscle: 'Biceps Long Head',     difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'MKqbJKgkHFc', cues: ['Sit on incline bench', 'Arms hang back', 'Curl without swinging', 'Supinate at top'],      description: 'The incline position stretches the long head of the bicep for peak development.' },
  { id: 'hammer',             name: 'Hammer Curl',            category: 'arms',         muscle: 'Arms',      specificMuscle: 'Brachialis',           difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'zC3nLlEvin4', cues: ['Neutral grip', 'Elbows fixed', 'Squeeze brachialis', 'Both sides equal'],                    description: 'Builds the brachialis for thick, peaked arms from all angles.' },
  { id: 'preacher_curl',      name: 'Preacher Curl',          category: 'arms',         muscle: 'Arms',      specificMuscle: 'Biceps Short Head',    difficulty: 'Beginner',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'fIWP-FRFNU0', cues: ['Arms on pad', 'Full stretch bottom', 'Squeeze at top', 'No momentum'],                      description: 'Eliminates cheating and isolates the biceps for pure peak development.' },
  { id: 'concentration_curl', name: 'Concentration Curl',     category: 'arms',         muscle: 'Arms',      specificMuscle: 'Biceps Long Head',     difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'Jvj2wV0vOYU', cues: ['Elbow on inner thigh', 'Full ROM', 'Supinate at top', 'Squeeze hard'],                      description: "The best isolation move for bicep peak — Arnold's secret weapon." },
  { id: 'cable_curl',         name: 'Cable Curl',             category: 'arms',         muscle: 'Arms',      specificMuscle: 'Biceps Short Head',    difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: '85ZJC4XCdpc', cues: ['Constant tension', 'Elbows pinned', 'Squeeze at top', 'Slow eccentric'],                     description: 'Cables maintain tension throughout the entire range of motion.' },
  { id: 'pushdown',           name: 'Tricep Pushdown',        category: 'arms',         muscle: 'Arms',      specificMuscle: 'Triceps Lateral Head', difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: '2-LAMcpzODU', cues: ['Elbows pinned', 'Full extension', 'Squeeze triceps', 'Control return'],                      description: 'The most reliable mass-builder for the lateral head of the triceps.' },
  { id: 'closebench',         name: 'Close-Grip Bench',       category: 'arms',         muscle: 'Arms',      specificMuscle: 'Triceps Medial Head',  difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'nEF0bv2FW94', cues: ['Hands shoulder-width', 'Elbows tucked', 'Bar to lower chest', 'Drive through tris'],         description: 'Compound triceps builder that allows heavy loading for serious arm growth.' },
  { id: 'skull_crusher',      name: 'Skull Crusher',          category: 'arms',         muscle: 'Arms',      specificMuscle: 'Triceps Long Head',    difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'd_KZxkY_0cM', cues: ['Elbows fixed', 'Lower to forehead', 'Full extension', 'Slow eccentric'],                    description: 'Isolation movement that targets all three heads of the triceps.' },
  { id: 'overhead_tricep',    name: 'Overhead Tricep Ext',    category: 'arms',         muscle: 'Arms',      specificMuscle: 'Triceps Long Head',    difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: '_gsUck-7M74', cues: ['Elbows close to ears', 'Full overhead stretch', 'Squeeze top', 'Control descent'],          description: 'Best move for stretching and developing the long head of the triceps.' },
  { id: 'tricep_dips',        name: 'Tricep Dips',            category: 'arms',         muscle: 'Arms',      specificMuscle: 'Triceps Lateral Head', difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: '6kALZikXxLc', cues: ['Body upright', 'Lower until 90°', 'Drive through palms', 'Lock out top'],                  description: 'Bodyweight tricep builder that hits all three heads with progression.' },

  // ── LEGS ──
  { id: 'squat',              name: 'Back Squat',             category: 'legs',         muscle: 'Legs',      specificMuscle: 'Quads',                difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'SW_C1A-rejs', cues: ['Bar on traps', 'Sit back and down', 'Knees track over toes', 'Drive through heels'],         description: 'The king of leg exercises. Builds total lower body strength and mass.' },
  { id: 'front_squat',        name: 'Front Squat',            category: 'legs',         muscle: 'Legs',      specificMuscle: 'Quads',                difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'tlfahNdNPPI', cues: ['Bar on front delts', 'Elbows up high', 'Stay upright', 'Drive through heels'],               description: 'Emphasizes the quads with an upright torso position.' },
  { id: 'legpress',           name: 'Leg Press',              category: 'legs',         muscle: 'Legs',      specificMuscle: 'Quads',                difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: 'IZxyjW7MPJQ', cues: ['Feet shoulder-width', 'Lower to 90°', 'Drive through heels', "Don't lock knees"],            description: 'Heavy quad development with reduced lower back strain.' },
  { id: 'lunge',              name: 'Lunges',                 category: 'legs',         muscle: 'Legs',      specificMuscle: 'Glutes',               difficulty: 'Beginner',     equipment: 'Dumbbell',  unit: 'lbs',   youtubeId: 'D7KaRcUTQeE', cues: ['Step forward', 'Knee to floor', 'Drive through heel', 'Maintain balance'],                  description: 'Unilateral movement that builds quads, glutes, and stability.' },
  { id: 'leg_curl',           name: 'Leg Curl',               category: 'legs',         muscle: 'Legs',      specificMuscle: 'Hamstrings',           difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: '1Tq3QdYUuHs', cues: ['Pin adjusted', 'Full ROM', 'Squeeze hams', 'Control eccentric'],                            description: 'The most direct isolation move for hamstring development.' },
  { id: 'nordics',            name: 'Nordic Curl',            category: 'legs',         muscle: 'Legs',      specificMuscle: 'Hamstrings',           difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'wj2NHBxK1qE', cues: ['Anchor feet', 'Lower slowly', 'Resist eccentric', 'Push back up if needed'],                description: 'The most brutal hamstring builder. Eccentric strength on steroids.' },
  { id: 'leg_extension',      name: 'Leg Extension',          category: 'legs',         muscle: 'Legs',      specificMuscle: 'Quads',                difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: 'YyvSfVjQeL0', cues: ['Pin adjusted', 'Full extension', 'Squeeze quad top', 'Slow eccentric'],                     description: 'Quad isolation with full peak contraction for definition.' },
  { id: 'hip_thrust',         name: 'Hip Thrust',             category: 'legs',         muscle: 'Legs',      specificMuscle: 'Glutes',               difficulty: 'Intermediate', equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'LM8XHLYJoYs', cues: ['Upper back on bench', 'Bar over hips', 'Drive hips up', 'Squeeze glutes hard'],              description: 'The single best exercise for glute mass and strength.' },
  { id: 'glute_kickback',     name: 'Cable Glute Kickback',   category: 'legs',         muscle: 'Legs',      specificMuscle: 'Glutes',               difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: 'SqO-VUEAk5s', cues: ['Slight forward lean', 'Kick straight back', 'Squeeze glute', 'Control return'],             description: 'Glute isolation with constant cable tension for sculpting.' },
  { id: 'calf_raise',         name: 'Calf Raise',             category: 'legs',         muscle: 'Legs',      specificMuscle: 'Calves',               difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: '-M4-G8p8fmc', cues: ['Full stretch bottom', 'Explosive up', 'Squeeze top', 'Slow eccentric'],                      description: 'Direct calf development. Train them heavy and often.' },
  { id: 'seated_calf',        name: 'Seated Calf Raise',      category: 'legs',         muscle: 'Legs',      specificMuscle: 'Calves',               difficulty: 'Beginner',     equipment: 'Machine',   unit: 'lbs',   youtubeId: 'JbyjNymZOt0', cues: ['Pad on knees', 'Full stretch', 'Squeeze top', 'Hold contraction'],                          description: 'Targets the soleus for full, complete calf development.' },
  { id: 'sumo_deadlift',      name: 'Sumo Deadlift',          category: 'legs',         muscle: 'Legs',      specificMuscle: 'Glutes',               difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'wYREQkVtvEc', cues: ['Wide stance', 'Toes 45° out', 'Knees out', 'Drive floor apart'],                            description: 'Wider stance shifts emphasis to glutes and quads with shorter ROM.' },

  // ── CORE ──
  { id: 'plank',              name: 'Plank',                  category: 'core',         muscle: 'Core',      specificMuscle: 'Transverse Abdominis', difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'sec',   youtubeId: 'ASdvN_XEl_c', cues: ['Straight line head to heels', 'Squeeze glutes', 'Breathe normally', 'Engage core'],          description: 'Isometric core builder for stability and deep abdominal strength.' },
  { id: 'situp',              name: 'Sit-Ups',                category: 'core',         muscle: 'Core',      specificMuscle: 'Upper Abs',            difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: '1fbU_MkV7NE', cues: ['Anchor feet', 'Crunch up', 'Full ROM', 'Slow eccentric'],                                    description: 'Classic core builder. Hits the rectus abdominis through full range.' },
  { id: 'hangleg',            name: 'Hanging Leg Raise',      category: 'core',         muscle: 'Core',      specificMuscle: 'Lower Abs',            difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'Pr1ieGZ5atk', cues: ['Hang from bar', 'Knees to chest', 'Control descent', 'No swinging'],                         description: 'Premier lower ab developer. Requires shoulder and grip strength.' },
  { id: 'abwheel',            name: 'Ab Wheel',               category: 'core',         muscle: 'Core',      specificMuscle: 'Transverse Abdominis', difficulty: 'Advanced',     equipment: 'Other',     unit: 'reps',  youtubeId: 'jVrEbgX3F_o', cues: ['Tight core', 'Roll out fully', 'Pull back with abs', 'No back arch'],                       description: 'Brutal full-body ab and core stability builder.' },
  { id: 'russian_twist',      name: 'Russian Twist',          category: 'core',         muscle: 'Core',      specificMuscle: 'Obliques',             difficulty: 'Beginner',     equipment: 'Other',     unit: 'reps',  youtubeId: 'wkD8rjkodUI', cues: ['Lean back 45°', 'Twist side to side', 'Hold weight', 'Tight core'],                         description: 'Classic oblique builder for that V-cut waist look.' },
  { id: 'cable_crunch',       name: 'Cable Crunch',           category: 'core',         muscle: 'Core',      specificMuscle: 'Upper Abs',            difficulty: 'Beginner',     equipment: 'Cable',     unit: 'lbs',   youtubeId: '6GMKPQVERzw', cues: ['Kneel facing cable', 'Crunch down', 'Squeeze abs hard', 'Slow eccentric'],                  description: 'Loaded crunch variation for true ab hypertrophy.' },
  { id: 'side_plank',         name: 'Side Plank',             category: 'core',         muscle: 'Core',      specificMuscle: 'Obliques',             difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'sec',   youtubeId: 'K2VljzCC16g', cues: ['Body straight line', 'Hip up', 'Tight core', 'Both sides equal'],                           description: 'Isometric oblique builder for lateral core stability.' },
  { id: 'dead_bug',           name: 'Dead Bug',               category: 'core',         muscle: 'Core',      specificMuscle: 'Transverse Abdominis', difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'g_BYB0R-4Ws', cues: ['Lower back pressed down', 'Slow movements', 'Opposite arm/leg', 'Breathe out'],              description: 'Core stability with anti-extension. Builds deep ab strength safely.' },
  { id: 'leg_raise',          name: 'Lying Leg Raise',        category: 'core',         muscle: 'Core',      specificMuscle: 'Lower Abs',            difficulty: 'Beginner',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'JB2oyawG9KI', cues: ['Lower back pressed flat', 'Legs straight', 'Slow descent', "Don't touch floor"],             description: 'Lower abs focus. Pressing lower back down is key.' },

  // ── CARDIO ──
  { id: 'run',                name: 'Running',                category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Hip Flexors',          difficulty: 'Beginner',     equipment: 'Other',     unit: 'miles', youtubeId: '_kGESn8ArrU', cues: ['Land midfoot', 'Lean forward slightly', 'Arms relax', '180 cadence'],                       description: 'The most natural cardio. Build endurance and burn fat efficiently.' },
  { id: 'rowing',             name: 'Rowing Machine',         category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Hip Flexors',          difficulty: 'Beginner',     equipment: 'Machine',   unit: 'miles', youtubeId: 'H0r_ZPXJLtg', cues: ['Legs first', 'Then back', 'Then arms', 'Reverse on return'],                                description: 'Full-body cardio with serious calorie burn and back development.' },
  { id: 'jump_rope',          name: 'Jump Rope',              category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Calves',               difficulty: 'Beginner',     equipment: 'Other',     unit: 'sec',   youtubeId: '1BZM2Vre5oc', cues: ['Soft landings', 'Wrists do work', 'Stay on balls of feet', 'Steady rhythm'],                description: 'Coordination, calves, and conditioning in one efficient package.' },
  { id: 'burpee',             name: 'Burpees',                category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Quads',                difficulty: 'Intermediate', equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'TU8QYVW0gDU', cues: ['Hands down', 'Jump back', 'Push-up', 'Jump up explosive'],                                  description: 'Full body movement that crushes your conditioning quickly.' },
  { id: 'bike',               name: 'Stationary Bike',        category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Quads',                difficulty: 'Beginner',     equipment: 'Machine',   unit: 'miles', youtubeId: 'iCgZ9ZyxN_4', cues: ['Seat height proper', 'Smooth pedaling', 'Vary resistance', 'Steady breathing'],              description: 'Low-impact cardio. Easy on joints, great for fat loss and recovery.' },
  { id: 'hiit_sprint',        name: 'Sprint Intervals',       category: 'cardio',       muscle: 'Cardio',    specificMuscle: 'Quads',                difficulty: 'Advanced',     equipment: 'Other',     unit: 'sec',   youtubeId: '6CrYIqaCUYA', cues: ['Maximum effort', '30s on/30s off', 'Drive arms', 'Recover fully'],                          description: 'Maximum cardiovascular adaptation in minimum time.' },

  // ── OLYMPIC ──
  { id: 'clean',              name: 'Power Clean',            category: 'olympic',      muscle: 'Olympic',   specificMuscle: 'Hamstrings',           difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'KwYJTpQ_x5A', cues: ['Explosive triple extension', 'High pull elbows', 'Catch in front rack', 'Athletic stance'],   description: 'Explosive total body power. The most athletic strength movement.' },
  { id: 'snatch',             name: 'Snatch',                 category: 'olympic',      muscle: 'Olympic',   specificMuscle: 'Hamstrings',           difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: '9HyWjAk7fhY', cues: ['Wide grip', 'Pull bar overhead', 'Athletic squat catch', 'Lock out tight'],                 description: 'The most technical lift. Total body coordination and explosive power.' },
  { id: 'clean_jerk',         name: 'Clean & Jerk',           category: 'olympic',      muscle: 'Olympic',   specificMuscle: 'Quads',                difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'PrD-3K_lOLE', cues: ['Clean first', 'Jerk dip-drive', 'Split or push jerk', 'Stand to lockout'],                   description: 'Combines clean and overhead. Maximum power and total body strength.' },
  { id: 'hang_clean',         name: 'Hang Clean',             category: 'olympic',      muscle: 'Olympic',   specificMuscle: 'Hamstrings',           difficulty: 'Advanced',     equipment: 'Barbell',   unit: 'lbs',   youtubeId: 'WK5LJzKp1uA', cues: ['Bar mid-thigh', 'Explosive hip drive', 'High pull', 'Catch front rack'],                    description: 'Power development without the full pull from the floor.' },

  // ── CALISTHENICS ──
  { id: 'muscle_up',          name: 'Muscle-Up',              category: 'calisthenics', muscle: 'Bodyweight',specificMuscle: 'Lats',                 difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'KqzdFqJ47kk', cues: ['Explosive pull', 'Drive elbows up', 'Roll over bar', 'Press to lockout'],                  description: 'The ultimate calisthenics movement. Combines pull-up and dip in one fluid motion.' },
  { id: 'handstand',          name: 'Handstand Push-Up',      category: 'calisthenics', muscle: 'Bodyweight',specificMuscle: 'Front Delt',           difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'B0RAYx8tjmA', cues: ['Wall support to start', 'Head touches floor', 'Drive up hard', 'Lock out elbows'],           description: 'Vertical pressing with bodyweight. Insane shoulder development.' },
  { id: 'pistol',             name: 'Pistol Squat',           category: 'calisthenics', muscle: 'Bodyweight',specificMuscle: 'Quads',                difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'qDcniqddTeE', cues: ['Single leg', 'Other leg extended', 'Full depth', 'Stand up controlled'],                    description: 'Single leg squat that demands strength, balance, and mobility.' },
  { id: 'dragon_flag',        name: 'Dragon Flag',            category: 'calisthenics', muscle: 'Bodyweight',specificMuscle: 'Lower Abs',            difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'XKnFGmkRtUg', cues: ['Body straight', 'Shoulders anchored', 'Slow lower', 'Hold position'],                       description: "Bruce Lee's signature core builder. Insane ab strength required." },
  { id: 'l_sit',              name: 'L-Sit',                  category: 'calisthenics', muscle: 'Bodyweight',specificMuscle: 'Hip Flexors',          difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'sec',   youtubeId: 'XPPfnSEATJA', cues: ['Hands beside hips', 'Legs straight horizontal', 'Tight core', 'Push down hard'],            description: 'Isometric core and shoulder builder. Foundation for advanced moves.' },
  { id: 'ring_dip',           name: 'Ring Dips',              category: 'calisthenics', muscle: 'Bodyweight',specificMuscle: 'Triceps Lateral Head', difficulty: 'Advanced',     equipment: 'Bodyweight',unit: 'reps',  youtubeId: 'lP5p9fnY3eM', cues: ['Rings turned out', 'Stable position', 'Full depth', 'Turn out at top'],                     description: 'Rings add stability demand to dips. Insane upper body development.' },
]

// ─── Equipment matcher ────────────────────────────────────────────────────────

function matchesEquipment(ex: ExerciseEntry, filter: string): boolean {
  if (filter === 'all') return true
  if (filter === 'Other') {
    return !['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight'].includes(ex.equipment)
  }
  return ex.equipment === filter
}

// ─── Difficulty styles ────────────────────────────────────────────────────────

const DIFFICULTY_STYLES = {
  Beginner: 'text-green-400 bg-green-400/10 border-green-400/20',
  Intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Advanced: 'text-red-400 bg-red-400/10 border-red-400/20',
}

// ─── Filter Pill Row ──────────────────────────────────────────────────────────

function FilterRow<T extends { id: string; label: string }>({
  options, active, onChange,
}: { options: T[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            'flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
            active === opt.id
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
          )}
        >
          {'emoji' in opt ? `${(opt as { emoji: string } & T).emoji} ` : ''}{opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({ exercise }: { exercise: ExerciseEntry }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Dumbbell className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{exercise.name}</p>
          <p className="text-xs text-muted-foreground">{exercise.specificMuscle} · {exercise.equipment}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', DIFFICULTY_STYLES[exercise.difficulty])}>
            {exercise.difficulty}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {/* Animation replaces the YouTube link */}
          <ExerciseAnimation exercise={exercise} />

          <p className="text-sm text-muted-foreground">{exercise.description}</p>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase text-muted-foreground">Form Cues</p>
            <div className="flex flex-wrap gap-1.5">
              {exercise.cues.map((cue, i) => (
                <span key={i} className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                  {cue}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type FilterMode = 'equipment' | 'muscle' | 'specific'

export function ExercisesPage() {
  const [search, setSearch]               = useState('')
  const [filterMode, setFilterMode]       = useState<FilterMode>('muscle')
  const [equipFilter, setEquipFilter]     = useState('all')
  const [muscleFilter, setMuscleFilter]   = useState('all')
  const [specificFilter, setSpecificFilter] = useState('all')

  const filtered = ALL_EXERCISES.filter(ex => {
    const matchSearch =
      !search ||
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.specificMuscle.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscle.toLowerCase().includes(search.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(search.toLowerCase())

    const matchEquip   = filterMode === 'equipment' ? matchesEquipment(ex, equipFilter)                               : true
    const matchMuscle  = filterMode === 'muscle'    ? (muscleFilter   === 'all' || ex.category === muscleFilter)      : true
    const matchSpecific = filterMode === 'specific' ? (specificFilter === 'all' || ex.specificMuscle === specificFilter) : true

    return matchSearch && matchEquip && matchMuscle && matchSpecific
  })

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search exercises, muscles, equipment..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-secondary/60 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Filter mode tabs */}
      <div className="flex gap-2 rounded-2xl bg-secondary/60 p-1">
        {(['equipment', 'muscle', 'specific'] as FilterMode[]).map(mode => (
          <button
            key={mode}
            type="button"
            onClick={() => setFilterMode(mode)}
            className={cn(
              'flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition-colors',
              filterMode === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            {mode === 'specific' ? 'Specific' : mode === 'muscle' ? 'Muscle Group' : 'Equipment'}
          </button>
        ))}
      </div>

      {/* Filter chips */}
      {filterMode === 'equipment' && (
        <FilterRow options={EQUIPMENT_FILTERS} active={equipFilter} onChange={setEquipFilter} />
      )}
      {filterMode === 'muscle' && (
        <FilterRow options={MUSCLE_GROUP_FILTERS} active={muscleFilter} onChange={setMuscleFilter} />
      )}
      {filterMode === 'specific' && (
        <FilterRow options={SPECIFIC_MUSCLE_FILTERS} active={specificFilter} onChange={setSpecificFilter} />
      )}

      {/* Count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-semibold text-foreground">No exercises found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter</p>
          </div>
        ) : (
          filtered.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)
        )}
      </div>
    </div>
  )
}
